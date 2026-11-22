import { supabase } from '@/lib/supabaseClient'
import { MCA_EXCLUSION } from '@/lib/gmc/accountSync'
import { describeFields, formatRunDate, splitCalls, summarizeRun, TRIGGER_LABELS, type SyncRun } from '@/lib/gmc/syncDisplay'
import SyncButton from './SyncButton'
import ExcludeToggle from './ExcludeToggle'

// Données privées des clients : jamais mises en cache.
export const dynamic = 'force-dynamic'

type Account = {
    account_id: string
    name: string | null
    website: string | null
    account_type: 'standalone' | 'subaccount' | 'mca' | 'unknown'
    aggregator_id: string | null
    css_provider_id: string | null
    css_provider_name: string | null
    ads_customer_ids: string[]
    active: boolean
    excluded: boolean
    excluded_reason: string | null
    access_status: 'never' | 'ok' | 'denied'
    access_checked_at: string | null
    deactivated_at: string | null
}

const TYPE_LABELS: Record<Account['account_type'], string> = {
    standalone: 'Standalone',
    subaccount: 'Sous-compte',
    mca: 'MCA',
    unknown: '—',
}

const ACCESS: Record<Account['access_status'], { dot: string; label: string }> = {
    never: { dot: 'bg-zinc-300 dark:bg-zinc-600', label: 'Jamais lu' },
    ok: { dot: 'bg-emerald-500', label: 'Lu OK' },
    denied: { dot: 'bg-red-500', label: 'Accès refusé' },
}

const RUN_TONE: Record<SyncRun['status'], string> = {
    ok: 'bg-emerald-50/60 dark:bg-emerald-950/30',
    aborted: 'bg-amber-50 dark:bg-amber-950/30',
    error: 'bg-red-50 dark:bg-red-950/30',
    running: 'bg-zinc-50 dark:bg-zinc-900',
}

const SECTION = 'text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400'
const EXTERNAL = 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5'
const ADS = 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3'
const CHEVRON = 'M6 9l6 6 6-6'

function Icon({ path, className }: { path: string; className: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
        </svg>
    )
}

const formatAdsId = (id: string) => id.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')
const shortCss = (name: string | null) => (name ?? '').replace(/\s*\(.*\)\s*$/, '') || '—'
const isLynqCss = (a: Account) =>
    (!!process.env.LYNQ_CSS_DOMAIN_ID && a.css_provider_id === process.env.LYNQ_CSS_DOMAIN_ID) || /lynq/i.test(a.css_provider_name ?? '')

/** Surveillés d'abord, puis exclus, puis inactifs ; par nom. */
function rank(a: Account) {
    return !a.active ? 2 : a.excluded ? 1 : 0
}

async function load() {
    const [accounts, runs] = await Promise.all([
        supabase
            .from('gmc_accounts')
            .select(
                'account_id, name, website, account_type, aggregator_id, css_provider_id, css_provider_name, ads_customer_ids, active, excluded, excluded_reason, access_status, access_checked_at, deactivated_at',
            ),
        supabase.from('gmc_sync_runs').select('*').order('started_at', { ascending: false }).limit(10),
    ])
    const list = ((accounts.data ?? []) as Account[]).sort(
        (a, b) => rank(a) - rank(b) || (a.name ?? a.account_id).localeCompare(b.name ?? b.account_id, 'fr'),
    )
    return { accounts: list, runs: (runs.data ?? []) as SyncRun[], error: accounts.error?.message ?? runs.error?.message ?? null }
}

function RunDetails({ run, names }: { run: SyncRun; names: Map<string, string> }) {
    const { listings, detailErrors } = splitCalls(run.calls ?? [])
    const c = run.changes ?? {}
    const named = (ids?: string[]) => (ids ?? []).map((id) => names.get(id) ?? id).join(', ')
    const lines = [
        c.added?.length ? { tone: 'text-emerald-700 dark:text-emerald-400', text: `+${c.added.length} ajouté(s) · ${named(c.added)}` } : null,
        c.reactivated?.length ? { tone: 'text-emerald-700 dark:text-emerald-400', text: `${c.reactivated.length} réactivé(s) · ${named(c.reactivated)}` } : null,
        c.deactivated?.length ? { tone: 'text-red-700 dark:text-red-400', text: `−${c.deactivated.length} désactivé(s) · ${named(c.deactivated)}` } : null,
        c.excluded?.length ? { tone: '', text: `${c.excluded.length} exclu(s) (MCA) · ${named(c.excluded)}` } : null,
        ...(c.updated ?? []).map((u) => ({ tone: '', text: `${names.get(u.accountId) ?? u.accountId} : ${describeFields(u.fields)}` })),
    ].filter((l): l is { tone: string; text: string } => l !== null)

    return (
        <div className="grid gap-6 border-t border-zinc-100 px-5 py-4 text-sm dark:border-zinc-800 md:grid-cols-3">
            <div>
                <p className={SECTION}>Appelé</p>
                {listings.length === 0 && <p className="mt-2 text-zinc-500">Aucun compte de service.</p>}
                {listings.map((call, i) => (
                    <div key={i} className="mt-2">
                        <p className="break-all font-semibold text-zinc-900 dark:text-white">{call.serviceAccount}</p>
                        <p className="text-zinc-500">{call.call}</p>
                    </div>
                ))}
            </div>
            <div>
                <p className={SECTION}>Réponse de Google</p>
                {listings.map((call, i) => (
                    <p key={i} className="mt-2">
                        <span
                            className={`rounded-md px-1.5 py-0.5 font-semibold tabular-nums ${
                                call.httpStatus === 200
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                    : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                            }`}
                        >
                            {call.httpStatus ?? '—'}
                        </span>{' '}
                        {call.httpStatus === 200 ? `${call.count ?? 0} compte(s)` : call.error}
                    </p>
                ))}
                <p className="mt-1 text-zinc-500">
                    Détail : {detailErrors.length === 0 ? 'aucune erreur' : `${detailErrors.length} erreur(s)`}
                </p>
                {detailErrors.slice(0, 5).map((call, i) => (
                    <p key={i} className="mt-1 text-xs text-red-700 dark:text-red-400">
                        {call.call} · {call.error}
                    </p>
                ))}
            </div>
            <div>
                <p className={SECTION}>En base</p>
                {run.status !== 'ok' && run.error && <p className="mt-2 text-zinc-700 dark:text-zinc-300">{run.error}</p>}
                {run.status === 'ok' && lines.length === 0 && <p className="mt-2 text-zinc-500">Aucun changement</p>}
                {lines.map((line, i) => (
                    <p key={i} className={`mt-2 ${line.tone}`}>
                        {line.text}
                    </p>
                ))}
            </div>
        </div>
    )
}

export default async function AlertsPage() {
    const { accounts, runs, error } = await load()
    const monitored = accounts.filter((a) => a.active && !a.excluded).length
    const names = new Map(accounts.map((a) => [a.account_id, a.name ?? a.account_id]))

    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Alertes</h1>
                <SyncButton />
            </div>

            <div className="mt-6 flex gap-6 border-b border-zinc-200 text-sm font-semibold dark:border-zinc-800">
                <span title="Bientôt" className="cursor-default pb-3 text-zinc-400">
                    Alertes
                </span>
                <span className="border-b-2 border-zinc-900 pb-3 text-zinc-900 dark:border-white dark:text-white">
                    Comptes surveillés <span className="ml-1 tabular-nums text-zinc-400">{monitored}</span>
                </span>
            </div>

            {error && <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

            <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-wider text-zinc-400">
                        <tr>
                            <th className="w-10 py-3 pl-5" />
                            <th className="py-3 font-bold">Compte</th>
                            <th className="py-3 font-bold">ID Merchant Center</th>
                            <th className="py-3 font-bold">Type</th>
                            <th className="py-3 font-bold">CSS</th>
                            <th className="py-3 text-right font-bold">Ads</th>
                            <th className="w-14 py-3 pr-5" />
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 && (
                            <tr className="border-t border-zinc-100 dark:border-zinc-800">
                                <td colSpan={7} className="px-5 py-6 text-center text-zinc-500">
                                    Aucun compte : lancez une synchro.
                                </td>
                            </tr>
                        )}
                        {accounts.map((a) => {
                            const faded = !a.active || a.excluded
                            const rowTitle = !a.active
                                ? `Plus visible par Google depuis le ${a.deactivated_at ? formatRunDate(a.deactivated_at) : '?'}`
                                : a.excluded
                                  ? a.excluded_reason === MCA_EXCLUSION
                                      ? 'MCA : exclu d’office'
                                      : 'Exclu de la surveillance'
                                  : undefined
                            return (
                                <tr key={a.account_id} title={rowTitle} className={`border-t border-zinc-100 dark:border-zinc-800 ${faded ? 'opacity-45' : ''}`}>
                                    <td className="py-3 pl-5">
                                        <span title={ACCESS[a.access_status].label} className={`inline-block h-2.5 w-2.5 rounded-full ${ACCESS[a.access_status].dot}`} />
                                    </td>
                                    <td className="py-3 font-semibold text-zinc-900 dark:text-white" title={a.website ?? undefined}>
                                        {a.name ?? '—'}
                                    </td>
                                    <td className="py-3">
                                        <a
                                            href={`https://merchants.google.com/mc/overview?a=${a.account_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Ouvrir dans Merchant Center"
                                            className="inline-flex items-center gap-1 tabular-nums text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                                        >
                                            {a.account_id}
                                            <Icon path={EXTERNAL} className="h-3.5 w-3.5 text-zinc-400" />
                                        </a>
                                    </td>
                                    <td className="py-3 text-zinc-600 dark:text-zinc-400" title={a.aggregator_id ? `MCA parent : ${a.aggregator_id}` : undefined}>
                                        {TYPE_LABELS[a.account_type]}
                                    </td>
                                    <td className={`py-3 ${isLynqCss(a) ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                        {isLynqCss(a) ? 'Lynq' : shortCss(a.css_provider_name)}
                                    </td>
                                    <td className="py-3 text-right">
                                        {a.ads_customer_ids.length > 0 && (
                                            <span
                                                title={`Google Ads ${a.ads_customer_ids.map(formatAdsId).join(', ')}`}
                                                className="inline-flex text-zinc-600 dark:text-zinc-400"
                                            >
                                                <Icon path={ADS} className="h-4 w-4" />
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 pr-5 text-right">
                                        {a.active && (
                                            <ExcludeToggle accountId={a.account_id} excluded={a.excluded} locked={a.excluded_reason === MCA_EXCLUSION} />
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <p className={`mt-10 ${SECTION}`}>Journal des synchros</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {runs.length === 0 && <p className="px-5 py-6 text-center text-sm text-zinc-500">Aucune synchro pour l’instant.</p>}
                {runs.map((run, index) => (
                    <details key={run.id} open={index === 0} className="group border-t border-zinc-100 first:border-t-0 dark:border-zinc-800">
                        <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-sm ${RUN_TONE[run.status]}`}>
                            <span className="flex flex-wrap items-center gap-x-6 gap-y-1">
                                <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">{formatRunDate(run.started_at)}</span>
                                <span className="text-zinc-500">{TRIGGER_LABELS[run.trigger]}</span>
                                <span className="text-zinc-700 dark:text-zinc-300">{summarizeRun(run)}</span>
                            </span>
                            <Icon path={CHEVRON} className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
                        </summary>
                        <RunDetails run={run} names={names} />
                    </details>
                ))}
            </div>
        </div>
    )
}
