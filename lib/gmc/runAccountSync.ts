import { supabase } from '@/lib/supabaseClient'
import { listServiceAccounts, type ServiceAccount } from '@/lib/google/serviceAccounts'
import { planAccountSync, type AccountListing, type AccountSignals, type StoredAccount, type SyncChanges } from './accountSync'
import { fetchAccountSignals, listAccounts, type CallRecord } from './merchantAccounts'

// ============================================================================
// Runs one sync of the monitored Merchant Center accounts and records it in
// `gmc_sync_runs` (diagnostic screen). Writes to `gmc_accounts` only.
// ============================================================================

const CONCURRENCY = 6
/** Detail calls stop after this budget (Vercel functions are cut at 60 s). */
const DETAIL_BUDGET_MS = 40_000
/** A run still "running" after this delay is considered dead. */
const STALE_RUN_MS = 10 * 60_000

export type SyncTrigger = 'manual' | 'schedule'

export type SyncResult =
    | { status: 'busy' }
    | { status: 'ok' | 'aborted' | 'error'; runId: number; changes?: SyncChanges; calls: CallRecord[]; error?: string }

const ACCOUNT_COLUMNS =
    'account_id, name, website, language_code, account_type, aggregator_id, css_provider_id, css_provider_name, ads_customer_ids, service_account, active, excluded, excluded_reason'

async function startRun(trigger: SyncTrigger): Promise<number | null> {
    // A run killed mid-way (timeout, crash) must not block the next ones.
    await supabase
        .from('gmc_sync_runs')
        .update({ status: 'error', finished_at: new Date().toISOString(), error: 'Synchro interrompue (délai dépassé).' })
        .eq('status', 'running')
        .lt('started_at', new Date(Date.now() - STALE_RUN_MS).toISOString())

    const { data, error } = await supabase.from('gmc_sync_runs').insert({ trigger, status: 'running' }).select('id').single()
    if (error) {
        if (error.code === '23505') return null // single-running lock: another sync is in progress
        throw new Error(`Journal des synchros indisponible : ${error.message}`)
    }
    return data.id as number
}

async function finishRun(runId: number, fields: { status: 'ok' | 'aborted' | 'error'; calls: CallRecord[]; changes?: SyncChanges; error?: string }) {
    await supabase
        .from('gmc_sync_runs')
        .update({
            status: fields.status,
            finished_at: new Date().toISOString(),
            calls: fields.calls,
            changes: fields.changes ?? {},
            error: fields.error ?? null,
        })
        .eq('id', runId)
}

/** Detail signals for every visible account, a few at a time, within the time budget. */
async function collectSignals(
    visible: { accountId: string; sa: ServiceAccount }[],
    calls: CallRecord[],
): Promise<Map<string, AccountSignals>> {
    const signals = new Map<string, AccountSignals>()
    const deadline = Date.now() + DETAIL_BUDGET_MS
    let next = 0
    let skipped = 0

    async function worker() {
        while (next < visible.length) {
            const { accountId, sa } = visible[next++]
            if (Date.now() > deadline) {
                skipped++
                continue
            }
            try {
                signals.set(accountId, await fetchAccountSignals(sa, accountId, calls))
            } catch (error) {
                calls.push({ serviceAccount: sa.email, call: `Détail du compte ${accountId}`, httpStatus: null, error: error instanceof Error ? error.message : String(error) })
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, visible.length) }, worker))

    if (skipped > 0) {
        calls.push({ serviceAccount: '—', call: 'Détail des comptes', httpStatus: null, error: `${skipped} compte(s) non détaillé(s) faute de temps : valeurs précédentes conservées.` })
    }
    return signals
}

export async function runAccountSync(trigger: SyncTrigger): Promise<SyncResult> {
    const runId = await startRun(trigger)
    if (runId === null) return { status: 'busy' }

    const calls: CallRecord[] = []
    try {
        const serviceAccounts = listServiceAccounts()

        // 1. Each service account lists the accounts it can read.
        const listings: AccountListing[] = []
        for (const sa of serviceAccounts) listings.push(await listAccounts(sa, calls))

        // 2. Previous state.
        const { data: previous, error: readError } = await supabase.from('gmc_accounts').select(ACCOUNT_COLUMNS)
        if (readError) throw new Error(`Lecture des comptes impossible : ${readError.message}`)

        // 3. Details, only if every listing succeeded (otherwise the plan aborts anyway).
        let signals = new Map<string, AccountSignals>()
        if (listings.length > 0 && listings.every((l) => l.ok)) {
            const bySa = new Map(serviceAccounts.map((sa) => [sa.email, sa]))
            const visible = new Map<string, ServiceAccount>()
            for (const listing of listings) {
                if (!listing.ok) continue
                for (const a of listing.accounts) if (!visible.has(a.accountId)) visible.set(a.accountId, bySa.get(listing.serviceAccount)!)
            }
            signals = await collectSignals([...visible].map(([accountId, sa]) => ({ accountId, sa })), calls)
        }

        // 4. Plan, then write.
        const plan = planAccountSync({ previous: (previous ?? []) as StoredAccount[], listings, signals })
        if (plan.abort) {
            await finishRun(runId, { status: 'aborted', calls, error: plan.reason })
            return { status: 'aborted', runId, calls, error: plan.reason }
        }

        const now = new Date().toISOString()
        for (let i = 0; i < plan.upserts.length; i += 500) {
            const chunk = plan.upserts.slice(i, i + 500).map((row) => ({ ...row, last_seen_at: now, deactivated_at: null, updated_at: now }))
            const { error } = await supabase.from('gmc_accounts').upsert(chunk, { onConflict: 'account_id' })
            if (error) throw new Error(`Écriture des comptes impossible : ${error.message}`)
        }
        if (plan.deactivate.length > 0) {
            const { error } = await supabase
                .from('gmc_accounts')
                .update({ active: false, deactivated_at: now, updated_at: now })
                .in('account_id', plan.deactivate)
            if (error) throw new Error(`Désactivation impossible : ${error.message}`)
        }

        await finishRun(runId, { status: 'ok', calls, changes: plan.changes })
        return { status: 'ok', runId, calls, changes: plan.changes }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await finishRun(runId, { status: 'error', calls, error: message })
        return { status: 'error', runId, calls, error: message }
    }
}
