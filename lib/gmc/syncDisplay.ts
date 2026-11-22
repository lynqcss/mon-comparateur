import type { SyncChanges } from './accountSync'
import type { CallRecord } from './merchantAccounts'

// Pure helpers for the "Comptes surveillés" screen (tested).

export type SyncRunStatus = 'running' | 'ok' | 'aborted' | 'error'

export type SyncRun = {
    id: number
    started_at: string
    finished_at: string | null
    trigger: 'manual' | 'schedule'
    status: SyncRunStatus
    calls: CallRecord[]
    changes: Partial<SyncChanges>
    error: string | null
}

const PARIS_DATE = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
})

/** « 21/11 · 13:53 », Paris time. */
export function formatRunDate(iso: string): string {
    const parts = Object.fromEntries(PARIS_DATE.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
    return `${parts.day}/${parts.month} · ${parts.hour}:${parts.minute}`
}

export const TRIGGER_LABELS: Record<SyncRun['trigger'], string> = { manual: 'Manuelle', schedule: 'Planifiée' }

/** One-line summary of a run, e.g. « +2 ajoutés · 1 désactivé ». */
export function summarizeRun(run: Pick<SyncRun, 'status' | 'changes'>): string {
    if (run.status === 'running') return 'En cours'
    if (run.status === 'aborted') return 'Interrompue, rien modifié'
    if (run.status === 'error') return 'Erreur'

    const c = run.changes ?? {}
    const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`
    const parts = [
        c.added?.length ? `+${plural(c.added.length, 'ajouté')}` : '',
        c.reactivated?.length ? plural(c.reactivated.length, 'réactivé') : '',
        c.deactivated?.length ? `−${plural(c.deactivated.length, 'désactivé')}` : '',
        c.excluded?.length ? plural(c.excluded.length, 'exclu') : '',
        c.updated?.length ? plural(c.updated.length, 'modifié') : '',
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(' · ') : 'Aucun changement'
}

/** Listing calls (one per service account) and detail calls, split for display. */
export function splitCalls(calls: CallRecord[]) {
    const listings = calls.filter((c) => c.call === 'Liste des comptes' || c.call === 'Jeton Google')
    const detailErrors = calls.filter((c) => !listings.includes(c))
    return { listings, detailErrors }
}

const FIELD_LABELS: Record<string, string> = {
    name: 'nom',
    website: 'site',
    account_type: 'type',
    aggregator_id: 'MCA parent',
    css_provider_id: 'CSS',
    ads_customer_ids: 'comptes Ads',
    service_account: 'compte de service',
    excluded: 'exclusion',
}

export function describeFields(fields: string[]): string {
    return fields.map((f) => FIELD_LABELS[f] ?? f).join(', ')
}
