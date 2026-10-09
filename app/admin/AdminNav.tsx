'use client'

import { usePathname } from 'next/navigation'
import Link from '@/app/components/AppLink'

const LINKS = [
    { href: '/admin', label: 'Accueil' },
    { href: '/admin/merchants', label: 'Marchands' },
    { href: '/admin/onboarding', label: 'Inscriptions' },
]

/** Barre de navigation commune à toutes les pages d'administration. */
export default function AdminNav() {
    const pathname = usePathname()
    const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

    return (
        <nav
            aria-label="Administration"
            className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
            <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
                <span className="mr-3 shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Admin
                </span>
                {LINKS.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                            isActive(link.href)
                                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                        }`}
                    >
                        {link.label}
                    </Link>
                ))}
            </div>
        </nav>
    )
}
