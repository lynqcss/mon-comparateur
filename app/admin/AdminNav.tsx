'use client'

import { usePathname } from 'next/navigation'
import Link from '@/app/components/AppLink'
import { CATALOG_LINKS, CSS_TOOLS, ICONS, isToolOpen } from '@/lib/admin/tools'

const LINK_BASE =
    'flex shrink-0 items-center gap-3 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors md:rounded-xl md:px-3 md:py-2.5'
const LINK_IDLE =
    'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
const LINK_CURRENT = 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
const LINK_SOON = 'text-zinc-400 dark:text-zinc-600'
const SECTION =
    'shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 md:px-3'

function Icon({ path }: { path: string }) {
    return (
        <svg className="hidden h-[18px] w-[18px] shrink-0 md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
        </svg>
    )
}

/**
 * Navigation commune à toutes les pages d'administration : barre latérale à
 * gauche sur ordinateur, bandeau horizontal défilant sur mobile. Un outil pas
 * encore activé est grisé ; en local, il reste cliquable pour les tests.
 */
export default function AdminNav() {
    const pathname = usePathname()
    const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

    const navLink = (href: string, label: string, icon: string, soon = false) => (
        <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? 'page' : undefined}
            className={`${LINK_BASE} ${isActive(href) ? LINK_CURRENT : soon ? `${LINK_SOON} hover:bg-zinc-200/70` : LINK_IDLE}`}
        >
            <Icon path={icon} />
            {label}
        </Link>
    )

    return (
        <nav
            aria-label="Administration"
            className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60 md:w-56 md:border-b-0 md:border-r"
        >
            <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 md:sticky md:top-[73px] md:flex-col md:items-stretch md:gap-1 md:overflow-visible md:px-3 md:py-6">
                <span className={`mr-3 md:mb-3 md:mr-0 ${SECTION}`}>Administration</span>
                {navLink('/admin', 'Accueil', ICONS.home)}

                <span className={`ml-3 md:mb-2 md:ml-0 md:mt-6 ${SECTION}`}>Outils CSS</span>
                {CSS_TOOLS.map((tool) => {
                    const soon = tool.status === 'soon'
                    if (isToolOpen(tool.id)) return navLink(tool.href, tool.menuLabel, tool.icon, soon)
                    return (
                        <span
                            key={tool.id}
                            aria-disabled="true"
                            title="Bientôt disponible"
                            className={`${LINK_BASE} ${LINK_SOON} cursor-default`}
                        >
                            <Icon path={tool.icon} />
                            {tool.menuLabel}
                        </span>
                    )
                })}

                <span className={`ml-3 md:mb-2 md:ml-0 md:mt-6 ${SECTION}`}>Catalogue Lynq</span>
                {CATALOG_LINKS.map((link) => navLink(link.href, link.label, link.icon))}
            </div>
        </nav>
    )
}
