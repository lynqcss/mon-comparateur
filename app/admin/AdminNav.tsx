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
        href: '/admin/leads',
        label: 'Demandes',
        icon: 'M4 5h16v14H4zM4 7l8 6 8-6',
    },
]

// Modules prévus, pas encore développés : affichés pour mémoire, non cliquables.
const UPCOMING = [
    { label: 'Alertes', icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0' },
    { label: 'Pilotage', icon: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3' },
    { label: 'Newsletter', icon: 'M3 8l7.9 5.3a2 2 0 002.2 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
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
                <span className="ml-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 md:mb-2 md:ml-0 md:mt-6 md:px-3">
                    À venir
                </span>
                {UPCOMING.map((item) => (
                    <span
                        key={item.label}
                        aria-disabled="true"
                        title="Bientôt disponible"
                        className="flex shrink-0 cursor-default items-center gap-3 rounded-full px-4 py-1.5 text-sm font-semibold text-zinc-400 dark:text-zinc-600 md:rounded-xl md:px-3 md:py-2.5"
                    >
                        <svg className="hidden h-[18px] w-[18px] shrink-0 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                        </svg>
                        {item.label}
                    </span>
                ))}
            </div>
        </nav>
    )
}
