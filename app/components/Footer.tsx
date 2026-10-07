'use client'

import Link from '@/app/components/AppLink'
import { useSearchParams } from 'next/navigation'
import { getTranslation } from '@/lib/i18n'

export default function Footer() {
    const searchParams = useSearchParams()
    const lang = searchParams.get('lang') || 'fr'
    const t = getTranslation(lang)

    // Ne propager QUE la langue et le pays, et seulement s'ils sont valides.
    // Recopier toute la query string faisait hériter chaque lien du pied de
    // page des filtres de /products (`/terms?brands=...&page=...`) : autant
    // d'URLs uniques, jamais en cache, qu'un crawler suivait par milliers.
    const buildUrl = (path: string) => {
        const next = new URLSearchParams()
        const country = searchParams.get('country')
        const currentLang = searchParams.get('lang')
        if (country && /^[A-Za-z]{2}$/.test(country)) next.set('country', country)
        if (currentLang === 'fr' || currentLang === 'en') next.set('lang', currentLang)
        const qs = next.toString()
        return qs ? `${path}?${qs}` : path
    }

    return (
        <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="md:col-span-2">
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
                            <li><Link prefetch={false} href={buildUrl('/products')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.nav.products}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/merchants')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.nav.merchants}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/join')} className="hover:text-zinc-900 dark:hover:text-white transition-colors underline decoration-zinc-200 underline-offset-4">{t.nav.diffuse}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/how-it-works')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.how_it_works}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">{t.footer.legal}</h4>
                        <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <li><Link prefetch={false} href={buildUrl('/terms')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.terms}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/privacy')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.privacy}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/cookies')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.cookies}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/legal')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.legal_mentions}</Link></li>
                            <li><Link prefetch={false} href={buildUrl('/contact')} className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t.footer.contact}</Link></li>
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
