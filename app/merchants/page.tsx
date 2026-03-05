// app/merchants/page.tsx
import Link from 'next/link'
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

export default async function MerchantsPage({ searchParams }: MerchantsPageProps) {
    const params = await searchParams
    const selectedCountry = params.country === 'PL' ? 'PL' : 'FR'
    const selectedLang = params.lang || (selectedCountry === 'FR' ? 'fr' : 'en')
    const t = getTranslation(selectedLang)

    // 1. Get IDs of merchants active in this country
    const { data: activeMerchantIds } = await supabase
        .from('products')
        .select('merchant_id')
        .eq('country_code', selectedCountry)
        .not('merchant_id', 'is', null)

    const uniqueIds = Array.from(new Set((activeMerchantIds || []).map(r => r.merchant_id)))

    let merchantList: MerchantRow[] = []

    if (uniqueIds.length > 0) {
        const { data: merchants, error } = await supabase
            .from('merchants')
            .select('id, name, website_url')
            .in('id', uniqueIds)
            .order('name', { ascending: true })

        if (!error) merchantList = merchants as MerchantRow[]
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

    return (
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            {/* Header & Country Selector */}
            <div className="mb-16 text-center">
                <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                    {t.merchants.title} <span className="text-gradient">{t.merchants.title_gradient}</span>
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
                    {t.merchants.subtitle} <span className="font-bold text-zinc-900 dark:text-white">{selectedCountry === 'PL' ? t.merchants.poland : t.merchants.france}</span>.
                </p>

                <div className="mt-8 flex justify-center gap-4">
                    <Link
                        href={`/merchants?country=FR&lang=${selectedLang}`}
                        className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${selectedCountry === 'FR' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                    >
                        {t.merchants.france} 🇫🇷
                    </Link>
                    <Link
                        href={`/merchants?country=PL&lang=${selectedLang}`}
                        className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${selectedCountry === 'PL' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                    >
                        {t.merchants.poland} 🇵🇱
                    </Link>
                </div>
            </div>

            {merchantList.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {merchantList.map((m) => {
                        const initial = m.name?.charAt(0).toUpperCase() || 'M'
                        const domain = getSafeDomain(m.website_url)

                        return (
                            <div key={m.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-100 bg-white p-8 transition-all hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 group-hover:scale-110 transition-transform overflow-hidden font-black text-zinc-300">
                                    <span className="text-2xl text-zinc-900 dark:text-white opacity-20 group-hover:opacity-100 transition-opacity">{initial}</span>
                                </div>

                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 truncate">{m.name || 'Marchand sans nom'}</h2>
                                <p className="text-xs font-medium text-zinc-400 mb-6 truncate">{domain}</p>

                                <div className="mt-auto space-y-3">
                                    <Link
                                        href={`/products?merchants=${m.id}&country=${selectedCountry}&lang=${selectedLang}`}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                                    >
                                        {t.merchants.view_offers}
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>

                                    {m.website_url && (
                                        <a
                                            href={m.website_url.startsWith('http') ? m.website_url : `https://${m.website_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex w-full items-center justify-center rounded-xl border border-zinc-100 py-3 text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                        >
                                            {t.merchants.visit_store}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-100 p-12 text-center dark:border-zinc-800">
                    <div className="mb-4 text-4xl">🔎</div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.merchants.no_merchants}</h3>
                    <p className="mt-2 text-sm text-zinc-500">{t.merchants.no_merchants_p}</p>
                    <Link href="/merchants" className="mt-6 rounded-full bg-zinc-900 px-6 py-2 text-sm font-bold text-white dark:bg-white dark:text-zinc-900">
                        {t.products.reset}
                    </Link>
                </div>
            )}

            {/* Google CSS Compliance Info */}
            <section className="mt-24 rounded-3xl bg-zinc-50 p-8 dark:bg-zinc-900/50">
                <div className="mx-auto max-w-3xl text-center">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.merchants.engagement_title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {t.merchants.engagement_p}
                    </p>
                </div>
            </section>
        </div>
    )
}
