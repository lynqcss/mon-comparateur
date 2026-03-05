'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import CountryLanguageSwitcher from './CountryLanguageSwitcher'
import { getTranslation } from '@/lib/i18n'

export default function Header() {
    const searchParams = useSearchParams()
    const lang = searchParams.get('lang') || 'fr'
    const t = getTranslation(lang)

    // Helper to preserve ONLY lang and country in links (resetting filters)
    const buildUrl = (path: string) => {
        const current = new URLSearchParams(searchParams.toString())
        const next = new URLSearchParams()
        if (current.has('country')) next.set('country', current.get('country')!)
        if (current.has('lang')) next.set('lang', current.get('lang')!)
        return `${path}?${next.toString()}`
    }

    return (
        <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/70">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    <Link href={buildUrl('/')} className="group flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white transition-all group-hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
                            <span className="text-xl font-bold italic">L</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Lynq<span className="text-zinc-400">CSS</span>
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

                <div className="flex items-center gap-4">
                    <CountryLanguageSwitcher />
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
                    <Link href={buildUrl('/join')} className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900">
                        {t.nav.diffuse}
                    </Link>
                </div>
            </div>
        </header>
    )
}
