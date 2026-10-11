// app/merchants/page.tsx
import Link from '@/app/components/AppLink'
import { supabase } from '@/lib/supabaseClient'
import { getTranslation } from '@/lib/i18n'

type MerchantRow = {
    id: number
    name: string | null
    website_url: string | null
}

type MerchantsPageProps = {
    searchParams: Promise<{
        country?: string
        lang?: string
    }>
}

export const metadata = {
    title: 'Nos Marchands Partenaires | Lynq CSS',
    description: 'Découvrez la liste des marchands partenaires de Lynq CSS et comparez leurs meilleures offres sur Google Shopping.',
}

// Supabase ne renvoie jamais plus de 1 000 lignes par requête.
const PAGE_ROWS = 1000
const MAX_ROWS = 50_000

/**
 * Marchands ayant au moins une offre dans un pays, avec leur nombre d'offres.
 * Le nombre sert seulement à savoir qui lister : il n'est pas affiché.
 */
async function countOffersByMerchant(country: string): Promise<Map<number, number>> {
    const counts = new Map<number, number>()
    for (let from = 0; from < MAX_ROWS; from += PAGE_ROWS) {
        const { data } = await supabase
            .from('products')
            .select('merchant_id')
            .eq('country_code', country)
            .not('merchant_id', 'is', null)
            .order('id')
            .range(from, from + PAGE_ROWS - 1)
        if (!data || data.length === 0) break
        for (const row of data) counts.set(row.merchant_id, (counts.get(row.merchant_id) ?? 0) + 1)
        if (data.length < PAGE_ROWS) break
    }
    return counts
}

function getSafeDomain(url: string | null) {
    if (!url) return ''
    try {
        const validUrl = url.startsWith('http') ? url : `https://${url}`
        return new URL(validUrl).hostname.replace('www.', '')
    } catch {
        return url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
    }
}

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
    const params = await searchParams
    const selectedCountry = params.country === 'PL' ? 'PL' : 'FR'
    const selectedLang = params.lang || (selectedCountry === 'FR' ? 'fr' : 'en')
    const isFr = selectedLang !== 'en'
    const t = getTranslation(selectedLang)

    const offerCounts = await countOffersByMerchant(selectedCountry)
    const uniqueIds = Array.from(offerCounts.keys())

    let merchantList: MerchantRow[] = []

    if (uniqueIds.length > 0) {
        const { data: merchants, error } = await supabase
            .from('merchants')
            .select('id, name, website_url')
            .in('id', uniqueIds)
            .order('name', { ascending: true })

        if (!error) merchantList = merchants as MerchantRow[]
    }

    const countries = [
        { code: 'FR', label: t.merchants.france },
        { code: 'PL', label: t.merchants.poland },
    ]

    return (
        <div className="bg-white dark:bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
                {/* En-tête */}
                <div className="mx-auto max-w-3xl text-center">
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        <span className="h-2 w-2 rounded-full bg-[#0FA968]" />
                        {isFr ? 'Annuaire' : 'Directory'}
                    </p>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                        {t.merchants.title} <span className="text-gradient">{t.merchants.title_gradient}</span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        {t.merchants.subtitle}{' '}
                        <span className="font-semibold text-zinc-900 dark:text-white">{selectedCountry === 'PL' ? t.merchants.poland : t.merchants.france}</span>.
                    </p>

                    <div className="mx-auto mt-8 flex w-fit rounded-full border border-zinc-200 bg-white p-1 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900" role="group">
                        {countries.map((country) => (
                            <Link
                                key={country.code}
                                href={`/merchants?country=${country.code}&lang=${selectedLang}`}
                                aria-current={selectedCountry === country.code ? 'page' : undefined}
                                className={`rounded-full px-5 py-2 transition-colors ${
                                    selectedCountry === country.code
                                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                                }`}
                            >
                                {country.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {merchantList.length > 0 ? (
                    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {merchantList.map((m) => {
                            const initial = m.name?.trim().charAt(0).toUpperCase() || 'M'
                            const domain = getSafeDomain(m.website_url)

                            return (
                                <div key={m.id} className="group flex flex-col rounded-3xl border border-zinc-200/70 bg-white p-6 transition-all hover:-translate-y-1 hover:border-[#0FA968] hover:shadow-[0_24px_50px_-28px_rgba(24,24,27,0.3)] dark:border-zinc-800 dark:bg-zinc-900/50">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg font-bold text-zinc-900 transition-colors group-hover:bg-[#0FA968] group-hover:text-white dark:bg-zinc-800 dark:text-white">
                                            {initial}
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="truncate text-base font-bold text-zinc-900 dark:text-white">{m.name || (isFr ? 'Marchand sans nom' : 'Unnamed merchant')}</h2>
                                            <p className="truncate text-sm text-zinc-500">{domain}</p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-2">
                                        <Link
                                            href={`/products?merchant=${m.id}&country=${selectedCountry}&lang=${selectedLang}`}
                                            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                                        >
                                            {t.merchants.view_offers}
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
                                            </svg>
                                        </Link>

                                        {m.website_url && (
                                            <a
                                                href={m.website_url.startsWith('http') ? m.website_url : `https://${m.website_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-white dark:hover:text-white"
                                            >
                                                {t.merchants.visit_store}
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5m0-5l-8 8M10 7H6a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-4" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="mt-14 flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M9 20v-6h6v6" />
                            </svg>
                        </span>
                        <h2 className="mt-5 text-lg font-bold text-zinc-900 dark:text-white">{t.merchants.no_merchants}</h2>
                        <p className="mt-2 max-w-sm text-sm text-zinc-500">{t.merchants.no_merchants_p}</p>
                        <Link href={`/merchants?country=FR&lang=${selectedLang}`} className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
                            {t.products.reset}
                        </Link>
                    </div>
                )}

                {/* Engagement */}
                <section className="mt-20 rounded-[2rem] border border-zinc-100 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">{t.merchants.engagement_title}</h2>
                        <p className="mt-4 leading-7 text-zinc-600 dark:text-zinc-400">{t.merchants.engagement_p}</p>
                    </div>
                </section>
            </div>
        </div>
    )
}
