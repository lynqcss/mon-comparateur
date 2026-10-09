'use client'

import { usePathname } from 'next/navigation'
import Link from '@/app/components/AppLink'

const LINKS = [
    {
        href: '/admin',
        label: 'Accueil',
        icon: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    },
    {
        href: '/admin/merchants',
        label: 'Marchands',
        icon: 'M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 20v-6h6v6',
    },
    {
        href: '/admin/onboarding',
        label: 'Inscriptions',
        icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6',
    },
]

/**
 * Navigation commune à toutes les pages d'administration : barre latérale à
 * gauche sur ordinateur, bandeau horizontal défilant sur mobile.
 */
export default function AdminNav() {
    const pathname = usePathname()
    const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

    return (
        <nav
            aria-label="Administration"
            className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60 md:w-56 md:border-b-0 md:border-r"
        >
            <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:sticky md:top-[73px] md:flex-col md:items-stretch md:gap-1 md:overflow-visible md:px-3 md:py-6">
                <span className="mr-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 md:mb-3 md:mr-0 md:px-3">
                    Administration
                </span>
                {LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:rounded-xl md:px-3 md:py-2.5 ${
                            isActive(link.href)
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                        }`}
                    >
                        <svg className="hidden h-[18px] w-[18px] shrink-0 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={link.icon} />
                        </svg>
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    )
}
