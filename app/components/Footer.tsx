'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getTranslation } from '@/lib/i18n'

export default function Footer() {
    const searchParams = useSearchParams()
    const lang = searchParams.get('lang') || 'fr'
    const t = getTranslation(lang)

    const buildUrl = (path: string) => {
        const params = new URLSearchParams(searchParams.toString())
        return `${path}?${params.toString()}`
    }

    return (
        <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                                <span className="text-sm font-bold italic">L</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight">Lynq CSS</span>
                        </div>
                        <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            {t.footer.description}
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">{t.footer.platform}</h4>
                        <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <li><Link href={buildUrl('/products')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.nav.products}</Link></li>
                            <li><Link href={buildUrl('/merchants')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.nav.merchants}</Link></li>
                            <li><Link href={buildUrl('/join')} className="hover:text-zinc-900 dark:hover:text-white transition-colors underline decoration-zinc-200 underline-offset-4">{t.nav.diffuse}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">{t.footer.legal}</h4>
                        <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <li><Link href={buildUrl('/terms')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.terms}</Link></li>
                            <li><Link href={buildUrl('/privacy')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.privacy}</Link></li>
                            <li><Link href={buildUrl('/cookies')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.cookies}</Link></li>
                            <li><Link href={buildUrl('/legal')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.legal_mentions}</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-zinc-100 pt-8 dark:border-zinc-800 text-center text-xs text-zinc-400">
                    © {new Date().getFullYear()} Lynq CSS. {t.footer.rights}
                </div>
            </div>
        </footer>
    )
}
