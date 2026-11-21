import Link from '@/app/components/AppLink'
import { supabase } from '@/lib/supabaseClient'

// Offres par marchand et par pays (déplacé depuis l'accueil admin). Le
// décompte relit les offres par pages de 1 000 : il est affiché en bas de la
// page Marchands et chargé après la liste, pour ne pas la ralentir.

const PAGE_ROWS = 1000
const MAX_ROWS = 100_000
const SOURCE_LABELS: Record<string, string> = { awin: 'Awin', gmc: 'Merchant Center', demo: 'Démonstration' }

type MerchantStat = { id: number; name: string; source: string; offers: Record<string, number>; total: number }

async function loadCatalogStats() {
    const { data: merchants } = await supabase.from('merchants').select('id, name, source')
    const stats = new Map<number, MerchantStat>()
    for (const m of merchants ?? []) {
        stats.set(m.id, { id: m.id, name: m.name ?? `Marchand ${m.id}`, source: m.source ?? 'gmc', offers: {}, total: 0 })
    }

    const byCountry: Record<string, number> = {}
    for (let from = 0; from < MAX_ROWS; from += PAGE_ROWS) {
        const { data } = await supabase
            .from('products')
            .select('merchant_id, country_code')
            .order('id')
            .range(from, from + PAGE_ROWS - 1)
        if (!data || data.length === 0) break
        for (const row of data) {
            const country = row.country_code ?? '?'
            byCountry[country] = (byCountry[country] ?? 0) + 1
            const stat = stats.get(row.merchant_id)
            if (stat) {
                stat.offers[country] = (stat.offers[country] ?? 0) + 1
                stat.total++
            }
        }
        if (data.length < PAGE_ROWS) break
    }

    const list = Array.from(stats.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    const bySource: Record<string, number> = {}
    for (const m of list) bySource[m.source] = (bySource[m.source] ?? 0) + 1
    return { list, byCountry, bySource, totalOffers: Object.values(byCountry).reduce((a, b) => a + b, 0) }
}

export function CatalogStatsSkeleton() {
    return <div className="mt-12 h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
}

export default async function CatalogStats() {
    const stats = await loadCatalogStats()
    const number = (n: number) => n.toLocaleString('fr-FR')
    const realMerchants = (stats.bySource.awin ?? 0) + (stats.bySource.gmc ?? 0)
    const countries = Object.keys(stats.byCountry).sort()
    const kpis = [
        { label: 'Marchands réels', value: number(realMerchants), hint: `${stats.bySource.awin ?? 0} Awin · ${stats.bySource.gmc ?? 0} Merchant Center` },
        { label: 'Marchands de démonstration', value: number(stats.bySource.demo ?? 0), hint: 'jamais mis à jour' },
        { label: 'Offres au total', value: number(stats.totalOffers), hint: countries.map((c) => `${c} ${number(stats.byCountry[c])}`).join(' · ') },
    ]

    return (
        <section className="mt-12">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Catalogue</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {kpis.map((kpi) => (
                    <div key={kpi.label} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{kpi.label}</p>
                        <p className="mt-2 text-3xl font-black tabular-nums text-zinc-900 dark:text-white">{kpi.value}</p>
                        <p className="mt-1 text-xs text-zinc-500">{kpi.hint}</p>
                    </div>
                ))}
            </div>

            <h2 className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Offres par marchand</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                        <tr>
                            <th className="px-5 py-3 font-bold">Marchand</th>
                            <th className="px-5 py-3 font-bold">Origine</th>
                            {countries.map((country) => (
                                <th key={country} className="px-5 py-3 text-right font-bold">{country}</th>
                            ))}
                            <th className="px-5 py-3 text-right font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {stats.list.map((m) => (
                            <tr key={m.id}>
                                <td className="px-5 py-2.5 font-semibold text-zinc-900 dark:text-white">
                                    <Link href={`/admin/merchants/${m.id}`} className="hover:underline">{m.name}</Link>
                                </td>
                                <td className="px-5 py-2.5 text-zinc-500">{SOURCE_LABELS[m.source] ?? m.source}</td>
                                {countries.map((country) => (
                                    <td key={country} className="px-5 py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                                        {m.offers[country] ? number(m.offers[country]) : '—'}
                                    </td>
                                ))}
                                <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-zinc-900 dark:text-white">{number(m.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
