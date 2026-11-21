import type { Metadata } from 'next'
import Link from '@/app/components/AppLink'
import { supabase } from '@/lib/supabaseClient'
import { CSS_TOOLS, ICONS, isToolOpen, type AdminTool } from '@/lib/admin/tools'

export const metadata: Metadata = {
    title: 'Administration — Lynq',
    robots: { index: false, follow: false },
}

// Chiffres privés du catalogue : jamais mis en cache.
export const dynamic = 'force-dynamic'

const GREY_CARD = 'border border-dashed border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40'
const LIVE_CARD =
    'border border-zinc-100 bg-white shadow-sm transition-all hover:border-zinc-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'

function Icon({ path, className }: { path: string; className: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
        </svg>
    )
}

function Soon() {
    return (
        <span className="shrink-0 rounded-full bg-zinc-200/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Bientôt
        </span>
    )
}

/** Lien quand l'outil est ouvert (toujours en local), simple bloc sinon. */
function ToolFrame({ tool, className, children }: { tool: AdminTool; className: string; children: React.ReactNode }) {
    return isToolOpen(tool.id) ? (
        <Link href={tool.href} className={className}>
            {children}
        </Link>
    ) : (
        <div aria-disabled="true" className={className}>
            {children}
        </div>
    )
}

function IconBox({ path, soon, large = false }: { path: string; soon: boolean; large?: boolean }) {
    const size = large ? 'h-16 w-16 rounded-2xl' : 'h-11 w-11 rounded-xl'
    const colors = soon
        ? 'bg-white text-zinc-400 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800'
        : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
    return (
        <span className={`flex shrink-0 items-center justify-center ${size} ${colors}`}>
            <Icon path={path} className={large ? 'h-8 w-8' : 'h-5 w-5'} />
        </span>
    )
}

/** Compteurs légers : aucune lecture des offres une par une. */
async function loadCatalogCounts() {
    const [merchants, offers, leads] = await Promise.all([
        supabase.from('merchants').select('source'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('merchant_leads').select('id', { count: 'exact', head: true }),
    ])
    const bySource: Record<string, number> = {}
    for (const m of merchants.data ?? []) bySource[m.source ?? 'gmc'] = (bySource[m.source ?? 'gmc'] ?? 0) + 1
    return {
        realMerchants: (bySource.awin ?? 0) + (bySource.gmc ?? 0),
        demoMerchants: bySource.demo ?? 0,
        offers: offers.count ?? 0,
        leads: leads.count ?? 0,
    }
}

export default async function AdminHomePage() {
    const counts = await loadCatalogCounts()
    const number = (n: number) => n.toLocaleString('fr-FR')
    const [main, ...secondary] = CSS_TOOLS
    const mainSoon = main.status === 'soon'

    const catalog = [
        {
            href: '/admin/merchants',
            title: 'Marchands',
            icon: ICONS.store,
            figure: `${number(counts.realMerchants)} réels · ${number(counts.demoMerchants)} démo · ${number(counts.offers)} offres`,
        },
        {
            href: '/admin/leads',
            title: 'Demandes',
            icon: ICONS.inbox,
            figure: `${number(counts.leads)} demande${counts.leads > 1 ? 's' : ''}`,
        },
    ]

    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Administration</h1>

            {/* Carte principale : l'état à gauche, le gros bouton à droite. */}
            <ToolFrame
                tool={main}
                className={`group mt-8 flex flex-col overflow-hidden rounded-3xl md:flex-row md:items-stretch ${mainSoon ? GREY_CARD : LIVE_CARD}`}
            >
                <span className="flex flex-1 items-center gap-6 p-6 sm:p-8">
                    <IconBox path={main.icon} soon={mainSoon} large />
                    <span className="min-w-0">
                        <span className={`block text-2xl font-black ${mainSoon ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>
                            {main.title}
                        </span>
                        {mainSoon && (
                            <span className="mt-2 block">
                                <Soon />
                            </span>
                        )}
                    </span>
                </span>
                <span
                    className={`flex items-center justify-center border-t p-6 sm:p-8 md:w-72 md:border-l md:border-t-0 ${
                        mainSoon ? 'border-dashed border-zinc-200 dark:border-zinc-800' : 'border-zinc-100 dark:border-zinc-800'
                    }`}
                >
                    <span
                        className={`w-full rounded-2xl px-6 py-4 text-center font-bold ${
                            mainSoon
                                ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                                : 'bg-zinc-900 text-white group-hover:bg-zinc-700 dark:bg-white dark:text-zinc-900'
                        }`}
                    >
                        Vérifier les alertes
                    </span>
                </span>
            </ToolFrame>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {secondary.map((tool) => {
                    const soon = tool.status === 'soon'
                    return (
                        <ToolFrame
                            key={tool.id}
                            tool={tool}
                            className={`flex items-center justify-between gap-3 rounded-2xl p-5 ${soon ? GREY_CARD : LIVE_CARD}`}
                        >
                            <span className="flex min-w-0 items-center gap-4">
                                <IconBox path={tool.icon} soon={soon} />
                                <span className={`font-bold ${soon ? 'text-zinc-500' : 'text-zinc-900 dark:text-white'}`}>{tool.title}</span>
                            </span>
                            {soon && <Soon />}
                        </ToolFrame>
                    )
                })}
            </div>

            <h2 className="mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Catalogue Lynq</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.map((item) => (
                    <Link key={item.href} href={item.href} className={`flex items-center gap-4 rounded-2xl p-5 ${LIVE_CARD}`}>
                        <IconBox path={item.icon} soon={false} />
                        <span className="min-w-0">
                            <span className="block font-bold text-zinc-900 dark:text-white">{item.title}</span>
                            <span className="block text-sm tabular-nums text-zinc-500">{item.figure}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    )
}
