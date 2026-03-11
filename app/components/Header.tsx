'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import CountryLanguageSwitcher from './CountryLanguageSwitcher'
import { getTranslation } from '@/lib/i18n'

export default function Header() {
    const searchParams = useSearchParams()
    const lang = searchParams.get('lang') || 'fr'
    const t = getTranslation(lang)

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Helper to preserve ONLY lang and country in links (resetting filters)
    const buildUrl = (path: string) => {
        const current = new URLSearchParams(searchParams.toString())
        const next = new URLSearchParams()
        if (current.has('country')) next.set('country', current.get('country')!)
        if (current.has('lang')) next.set('lang', current.get('lang')!)
        return `${path}?${next.toString()}`
    }

    return (
        <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href={buildUrl('/')} className="group flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                        <img src="/lynq-logo.svg" alt="Lynq Logo" className="h-8 w-auto text-zinc-900 dark:invert transition-transform group-hover:scale-105" />
                        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Lynq
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        <Link href={buildUrl('/products')} className="transition-colors hover:text-zinc-900 dark:hover:text-white">
                            {t.nav.products}
                        </Link>
                        <Link href={buildUrl('/merchants')} className="transition-colors hover:text-zinc-900 dark:hover:text-white">
                            {t.nav.merchants}
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="hidden sm:block">
                        <CountryLanguageSwitcher />
                    </div>
                    <div className="hidden h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 sm:block" />
                    <Link href={buildUrl('/join')} className="hidden sm:block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900">
                        {t.nav.diffuse}
                    </Link>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="ml-2 inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-500 focus:outline-none md:hidden"
                    >
                        <span className="sr-only">Open main menu</span>
                        {isMenuOpen ? (
                            <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 px-4 space-y-4 shadow-lg absolute w-full left-0">
                    <nav className="flex flex-col gap-4 text-base font-medium text-zinc-900 dark:text-white">
                        <Link href={buildUrl('/products')} onClick={() => setIsMenuOpen(false)} className="px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">
                            {t.nav.products}
                        </Link>
                        <Link href={buildUrl('/merchants')} onClick={() => setIsMenuOpen(false)} className="px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg">
                            {t.nav.merchants}
                        </Link>
                    </nav>
                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="mb-4">
                            <CountryLanguageSwitcher />
                        </div>
                        <Link href={buildUrl('/join')} onClick={() => setIsMenuOpen(false)} className="flex w-full justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white shadow-md active:scale-95 dark:bg-white dark:text-zinc-900">
                            {t.nav.diffuse}
                        </Link>
                    </div>
                </div>
            )}
        </header>
    )
}
