'use client'

import { useState } from 'react'
import LynqLogo from '@/app/components/LynqLogo'

// Hypothèses du simulateur.
const GOOGLE_MARGIN = 0.2
const LYNQ_COMMISSION = 0.005

type Mode = 'budget' | 'perf'

const COPY = {
    fr: {
        eyebrow: 'Simulateur',
        title: { budget: 'Le même budget, deux résultats', perf: 'Le même résultat, deux budgets' },
        intro: 'Vos annonces restent sur Google Shopping, à la même place. Seul le CSS qui les diffuse change.',
        budget: 'Budget annuel Google Shopping',
        cpc: 'CPC moyen',
        modes: { budget: 'À budget égal', perf: 'À performance égale' },
        network: 'Google Shopping',
        via: 'via le CSS',
        rows: {
            budget: 'Budget annuel',
            needed: 'Budget nécessaire',
            margin: 'Marge prélevée (20 %)',
            commission: 'Commission (0,5 %)',
            realBid: 'Enchère réelle',
            clicks: 'Clics obtenus',
        },
        badge: { clicks: 'clics', saved: 'économisés' },
        adLabel: 'Mention sur votre annonce',
        byGoogle: 'Par Google',
        byLynq: 'Par Lynq',
        note: 'Hypothèses : marge de 20 % prélevée par le CSS Google, commission Lynq de 0,5 %.',
    },
    en: {
        eyebrow: 'Simulator',
        title: { budget: 'Same budget, two results', perf: 'Same result, two budgets' },
        intro: 'Your ads stay on Google Shopping, in the same position. Only the CSS that serves them changes.',
        budget: 'Annual Google Shopping budget',
        cpc: 'Average CPC',
        modes: { budget: 'Same budget', perf: 'Same performance' },
        network: 'Google Shopping',
        via: 'via',
        rows: {
            budget: 'Annual budget',
            needed: 'Budget needed',
            margin: 'Margin taken (20%)',
            commission: 'Commission (0.5%)',
            realBid: 'Real bid',
            clicks: 'Clicks',
        },
        badge: { clicks: 'clicks', saved: 'saved' },
        adLabel: 'Label on your ad',
        byGoogle: 'By Google',
        byLynq: 'By Lynq',
        note: 'Assumptions: 20% margin taken by Google’s CSS, 0.5% Lynq commission.',
    },
}

function GoogleG({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

type RowData = { label: string; value: string; highlight?: boolean }

function Rows({ rows, accent }: { rows: RowData[]; accent: boolean }) {
    return (
        <dl className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-sm text-zinc-500 dark:text-zinc-400">{row.label}</dt>
                    <dd
                        className={`tabular-nums ${
                            row.highlight
                                ? `text-xl font-black ${accent ? 'text-[#0FA968]' : 'text-zinc-900 dark:text-white'}`
                                : 'text-base font-semibold text-zinc-900 dark:text-white'
                        }`}
                    >
                        {row.value}
                    </dd>
                </div>
            ))}
        </dl>
    )
}

export default function AuctionMechanism({ lang = 'fr' }: { lang?: string }) {
    const isFr = lang !== 'en'
    const t = COPY[isFr ? 'fr' : 'en']
    const locale = isFr ? 'fr-FR' : 'en-IE'

    const [budget, setBudget] = useState(200000)
    const [avgCpc, setAvgCpc] = useState(0.21)
    const [mode, setMode] = useState<Mode>('budget')

    const euro = (n: number) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n))
    const count = (n: number) => new Intl.NumberFormat(locale).format(Math.round(n))
    const cpcLabel = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(avgCpc)

    // CSS Google : la marge est prélevée sur le budget.
    const googleReal = budget * (1 - GOOGLE_MARGIN)
    const googleClicks = googleReal / avgCpc

    // CSS Lynq à budget égal : presque tout le budget part en enchère.
    const lynqReal = budget * (1 - LYNQ_COMMISSION)
    const lynqClicks = lynqReal / avgCpc

    // CSS Lynq à performance égale : même enchère réelle, budget réduit.
    const lynqBudgetNeeded = googleReal / (1 - LYNQ_COMMISSION)

    const googleRows: RowData[] = [
        { label: t.rows.budget, value: euro(budget), highlight: mode === 'perf' },
        { label: t.rows.margin, value: euro(budget * GOOGLE_MARGIN) },
        { label: t.rows.realBid, value: euro(googleReal) },
        { label: t.rows.clicks, value: count(googleClicks), highlight: mode === 'budget' },
    ]

    const lynqRows: RowData[] =
        mode === 'budget'
            ? [
                  { label: t.rows.budget, value: euro(budget) },
                  { label: t.rows.commission, value: euro(budget * LYNQ_COMMISSION) },
                  { label: t.rows.realBid, value: euro(lynqReal) },
                  { label: t.rows.clicks, value: count(lynqClicks), highlight: true },
              ]
            : [
                  { label: t.rows.needed, value: euro(lynqBudgetNeeded), highlight: true },
                  { label: t.rows.commission, value: euro(lynqBudgetNeeded * LYNQ_COMMISSION) },
                  { label: t.rows.realBid, value: euro(googleReal) },
                  { label: t.rows.clicks, value: count(googleClicks) },
              ]

    const badge =
        mode === 'budget'
            ? `+${count(lynqClicks - googleClicks)} ${t.badge.clicks}`
            : `${euro(budget - lynqBudgetNeeded)} ${t.badge.saved}`

    const sliderClass = 'mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[#0FA968] dark:bg-zinc-700'

    return (
        <div>
            <div className="mx-auto max-w-2xl text-center">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-[#0FA968]" />
                    {t.eyebrow}
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{t.title[mode]}</h2>
                <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">{t.intro}</p>
            </div>

            {/* Curseurs */}
            <div className="mx-auto mt-10 grid max-w-3xl gap-8 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 sm:p-8">
                <label className="block">
                    <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t.budget}</span>
                        <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white">{euro(budget)}</span>
                    </span>
                    <input
                        type="range"
                        min={10000}
                        max={2000000}
                        step={10000}
                        value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className={sliderClass}
                    />
                </label>
                <label className="block">
                    <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t.cpc}</span>
                        <span className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white">{cpcLabel}</span>
                    </span>
                    <input
                        type="range"
                        min={0.05}
                        max={3}
                        step={0.01}
                        value={avgCpc}
                        onChange={(e) => setAvgCpc(Number(e.target.value))}
                        className={sliderClass}
                    />
                </label>
            </div>

            {/* Choix du scénario */}
            <div className="mx-auto mt-6 flex w-fit rounded-full border border-zinc-200 bg-white p-1 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900" role="group">
                {(['budget', 'perf'] as const).map((value) => (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={mode === value}
                        onClick={() => setMode(value)}
                        className={`rounded-full px-5 py-2 transition-colors ${
                            mode === value
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                    >
                        {t.modes[value]}
                    </button>
                ))}
            </div>

            {/* Les deux cartes */}
            <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
                <div className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <GoogleG className="h-4 w-4" />
                        {t.network}
                    </p>
                    <p className="mt-2 flex h-7 items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                        {t.via} Google
                    </p>
                    <Rows rows={googleRows} accent={false} />
                    <p className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        {t.adLabel}
                        <span className="text-sm text-[#1a0dab] dark:text-[#8ab4f8]">{t.byGoogle}</span>
                    </p>
                </div>

                <div className="relative flex flex-col rounded-3xl border-2 border-[#0FA968] bg-white p-6 dark:bg-zinc-900 sm:p-8">
                    <span className="absolute -top-3 right-6 rounded-full bg-[#0FA968] px-3 py-1 text-xs font-bold text-white">{badge}</span>
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <GoogleG className="h-4 w-4" />
                        {t.network}
                    </p>
                    <p className="mt-2 flex h-7 items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                        {t.via}
                        <LynqLogo className="h-6 w-auto text-zinc-900 dark:text-white" />
                    </p>
                    <Rows rows={lynqRows} accent />
                    <p className="mt-auto flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        {t.adLabel}
                        <span className="text-sm text-[#1a0dab] dark:text-[#8ab4f8]">{t.byLynq}</span>
                    </p>
                </div>
            </div>

            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-zinc-400">{t.note}</p>
        </div>
    )
}
