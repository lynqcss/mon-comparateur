'use client'

import { useState } from 'react'

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + '€'

export default function AuctionMechanism({ lang = 'fr' }: { lang?: string }) {
    const isFr = lang === 'fr'
    const [budget, setBudget] = useState(200000)
    const [avgCpc, setAvgCpc] = useState(0.21)

    const googleMargin = 0.20
    const lynqCommission = 0.005

    // ISO-BUDGET: same budget, better results with Lynq
    const iso_googleReal = budget * (1 - googleMargin)
    const iso_lynqReal = budget * (1 - lynqCommission)
    const iso_googleComm = budget * googleMargin
    const iso_lynqComm = budget * lynqCommission
    const iso_extraClicks = Math.round((iso_lynqReal - iso_googleReal) / avgCpc)

    // ISO-PERF: same real bid, less budget needed with Lynq
    const perf_lynqBudget = iso_googleReal / (1 - lynqCommission)
    const perf_lynqComm = perf_lynqBudget * lynqCommission
    const perf_savings = budget - perf_lynqBudget

    const formatClicks = (n: number) => {
        if (n >= 1000000) return '+' + (n / 1000000).toFixed(2).replace('.', ',') + 'M'
        if (n >= 1000) return '+' + (n / 1000).toFixed(1).replace('.', ',') + 'k'
        return '+' + n
    }

    const formatSavings = (n: number) => {
        if (n >= 1000) return Math.round(n / 1000).toLocaleString('fr-FR') + 'k€'
        return Math.round(n) + '€'
    }

    return (
        <div className="mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* Left: Simulator */}
                <div>
                    <div className="flex justify-start mb-6">
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                            {isFr ? 'Simulateur' : 'Simulator'}
                        </span>
                    </div>

                    {/* Budget Slider */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-3">
                            {isFr ? 'Budget annuel Google Shopping' : 'Annual Google Shopping Budget'}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={10000}
                                max={2000000}
                                step={10000}
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="flex-1 h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:bg-zinc-700 dark:accent-white"
                            />
                            <span className="text-lg font-black text-zinc-900 dark:text-white min-w-[120px] text-right">
                                {fmt(budget)}
                            </span>
                        </div>
                    </div>

                    {/* CPC Slider */}
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-3">
                            {isFr ? 'CPC moyen' : 'Average CPC'}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0.05}
                                max={3}
                                step={0.01}
                                value={avgCpc}
                                onChange={(e) => setAvgCpc(Number(e.target.value))}
                                className="flex-1 h-2 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-zinc-900 dark:bg-zinc-700 dark:accent-white"
                            />
                            <span className="text-lg font-black text-zinc-900 dark:text-white min-w-[120px] text-right">
                                {avgCpc.toFixed(2).replace('.', ',')}€
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-zinc-200 overflow-hidden dark:border-zinc-700">
                        {/* Header */}
                        <div className="grid grid-cols-3 text-center text-xs font-bold uppercase tracking-wider">
                            <div className="bg-white dark:bg-zinc-900 p-3" />
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 text-zinc-500">CSS Google</div>
                            <div className="bg-zinc-900 dark:bg-white p-3 text-white dark:text-zinc-900">CSS Lynq</div>
                        </div>

                        {/* ISO-BUDGET section */}
                        <div className="relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full hidden xl:flex items-center pl-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Iso-Budget</span>
                            </div>
                            {[
                                {
                                    label: isFr ? 'Budget annuel' : 'Annual budget',
                                    google: fmt(budget),
                                    lynq: fmt(budget),
                                    highlight: false,
                                },
                                {
                                    label: isFr ? 'Enchère réelle' : 'Real bid value',
                                    google: fmt(iso_googleReal),
                                    lynq: fmt(iso_lynqReal),
                                    highlight: false,
                                },
                                {
                                    label: isFr ? 'Commission / an' : 'Commission / yr',
                                    google: fmt(iso_googleComm),
                                    lynq: fmt(iso_lynqComm),
                                    highlight: false,
                                },
                                {
                                    label: isFr ? `Clics supp. à ${avgCpc.toFixed(2).replace('.', ',')}€ CPC` : `Extra clicks at €${avgCpc.toFixed(2)} CPC`,
                                    google: '–',
                                    lynq: formatClicks(iso_extraClicks),
                                    highlight: true,
                                },
                            ].map((row, idx) => (
                                <div key={idx} className={`grid grid-cols-3 text-center text-sm border-t border-zinc-100 dark:border-zinc-800 ${row.highlight ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                                    <div className="p-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center">{row.label}</div>
                                    <div className="p-3 font-medium text-zinc-600 dark:text-zinc-400">{row.google}</div>
                                    <div className={`p-3 font-bold ${row.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>{row.lynq}</div>
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="border-t-2 border-zinc-200 dark:border-zinc-700" />

                        {/* ISO-PERF section */}
                        <div className="relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full hidden xl:flex items-center pl-3">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">Iso-Perf</span>
                            </div>
                            {[
                                {
                                    label: isFr ? 'Budget annuel' : 'Annual budget',
                                    google: fmt(budget),
                                    lynq: fmt(perf_lynqBudget),
                                    highlight: false,
                                },
                                {
                                    label: isFr ? 'Enchère réelle' : 'Real bid value',
                                    google: fmt(iso_googleReal),
                                    lynq: fmt(iso_googleReal),
                                    highlight: false,
                                },
                                {
                                    label: 'Commission',
                                    google: fmt(iso_googleComm),
                                    lynq: fmt(perf_lynqComm),
                                    highlight: false,
                                },
                                {
                                    label: isFr ? 'Économie' : 'Savings',
                                    google: '–',
                                    lynq: formatSavings(perf_savings),
                                    highlight: true,
                                },
                            ].map((row, idx) => (
                                <div key={idx} className={`grid grid-cols-3 text-center text-sm border-t border-zinc-100 dark:border-zinc-800 ${row.highlight ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                                    <div className="p-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center">{row.label}</div>
                                    <div className="p-3 font-medium text-zinc-600 dark:text-zinc-400">{row.google}</div>
                                    <div className={`p-3 font-bold ${row.highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>{row.lynq}</div>
                                </div>
                            ))}
                        </div>

                        {/* Footer: commission rates */}
                        <div className="grid grid-cols-3 text-center border-t-2 border-zinc-200 dark:border-zinc-700">
                            <div className="p-4 text-left text-xs font-bold text-zinc-900 dark:text-white flex items-center">
                                {isFr ? 'Commission' : 'Fee'}
                            </div>
                            <div className="p-4 flex items-center justify-center">
                                <span className="rounded-full bg-zinc-400 px-4 py-1.5 text-sm font-black text-white">20%</span>
                            </div>
                            <div className="p-4 flex items-center justify-center">
                                <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-black text-white">0,5%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Auction bar chart */}
                <div className="flex flex-col items-center lg:pt-12">
                    <div className="flex justify-center mb-8">
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-widest dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                            {isFr ? "Mécanique d'enchère" : 'Auction Mechanism'}
                        </span>
                    </div>

                    <p className="text-center text-xl font-bold text-zinc-900 dark:text-white mb-10">
                        {isFr ? 'Commerçant : ' : 'Merchant: '}
                        <span className="text-2xl">1,00€</span>
                        {isFr ? " d'enchère" : ' bid'}
                    </p>

                    <div className="grid grid-cols-2 gap-8 w-full max-w-xs">
                        {/* CSS Google bar */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-full h-[260px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                                <div className="bg-zinc-400 flex-[20] flex flex-col items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">{isFr ? 'Marge' : 'Margin'}</span>
                                    <span className="text-white text-base font-black">0,20€</span>
                                </div>
                                <div className="bg-zinc-600 flex-[80] flex flex-col items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">{isFr ? 'Enchère' : 'Bid'}</span>
                                    <span className="text-white text-xl font-black">0,80€</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">CSS Google</span>
                            </div>
                        </div>

                        {/* CSS Lynq bar */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-full h-[260px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex flex-col">
                                <div className="bg-emerald-400 flex-[1] flex items-center justify-center min-h-[24px]">
                                    <span className="text-white text-[9px] font-bold">0,005€</span>
                                </div>
                                <div className="bg-zinc-900 dark:bg-white flex-[99] flex flex-col items-center justify-center">
                                    <span className="text-white dark:text-zinc-900 text-[10px] font-bold">{isFr ? 'Enchère' : 'Bid'}</span>
                                    <span className="text-white dark:text-zinc-900 text-xl font-black">0,995€</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 rounded-full border-2 border-zinc-900 bg-zinc-900 px-4 py-2 dark:border-white dark:bg-white">
                                <span className="text-xs font-black text-white dark:text-zinc-900">⚡ CSS Lynq</span>
                            </div>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center leading-relaxed">
                            {isFr
                                ? <>Avec le CSS Google, Google prélève <span className="font-bold text-zinc-900 dark:text-white">20% de marge</span> sur chaque enchère. Avec le CSS Lynq, cette marge disparaît : <span className="font-bold text-zinc-900 dark:text-white">votre budget travaille à 100%</span>.</>
                                : <>With Google CSS, Google takes a <span className="font-bold text-zinc-900 dark:text-white">20% margin</span> on every bid. With Lynq CSS, this margin disappears: <span className="font-bold text-zinc-900 dark:text-white">your budget works at 100%</span>.</>
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
