import type { Metadata } from 'next'
import Link from '@/app/components/AppLink'

export const metadata: Metadata = {
    title: 'Fonctionnement du service — Lynq CSS',
    alternates: { canonical: '/how-it-works' },
}

type Props = {
    searchParams: Promise<{ lang?: string; country?: string }>
}

type Section = { title: string; body: string[] }

const SECTIONS: Record<'fr' | 'en', Section[]> = {
    fr: [
        {
            title: 'Ce que fait Lynq',
            body: [
                'Lynq est un comparateur de prix. Vous recherchez un produit, vous comparez les offres de plusieurs marchands, puis vous êtes redirigé vers la boutique de votre choix pour acheter.',
                'Lynq ne vend aucun produit : la commande, le paiement, la livraison et le service après-vente relèvent du marchand.',
            ],
        },
        {
            title: 'D’où viennent les offres',
            body: [
                'Les offres affichées proviennent des catalogues transmis par les marchands référencés sur Lynq, directement ou par l’intermédiaire de leurs partenaires.',
                'Le service n’est pas exhaustif : seules les offres de ces marchands sont comparées. D’autres offres peuvent exister ailleurs pour un même produit.',
            ],
        },
        {
            title: 'Comment les offres sont classées',
            body: [
                'Dans les listes de produits, les produits proposés par le plus grand nombre de marchands apparaissent en premier. Vous pouvez à tout moment trier par prix croissant ou décroissant, et filtrer par catégorie, par marque ou par prix.',
                'Sur une fiche produit, les offres sont classées par prix total croissant, c’est-à-dire le prix du produit augmenté des frais de livraison lorsqu’ils sont communiqués. Une seule offre est affichée par marchand : la moins chère.',
            ],
        },
        {
            title: 'Rémunération et indépendance du classement',
            body: [
                'Lynq peut être rémunéré par les marchands référencés, sous forme d’un abonnement à son service de diffusion sur Google Shopping ou d’une commission lorsqu’un achat suit un clic.',
                'Cette rémunération n’a aucune influence sur le classement des offres : aucun marchand ne peut payer pour apparaître avant un autre.',
            ],
        },
        {
            title: 'Prix et mise à jour',
            body: [
                'Les prix sont affichés toutes taxes comprises, tels que les marchands les communiquent. Les frais de livraison sont indiqués lorsque le marchand les a transmis.',
                'Les offres sont actualisées à partir des catalogues des marchands, en principe une fois par jour. Un prix ou une disponibilité peut avoir changé entre-temps : seules les informations affichées sur le site du marchand au moment de l’achat font foi.',
            ],
        },
    ],
    en: [
        {
            title: 'What Lynq does',
            body: [
                'Lynq is a price comparison service. You search for a product, compare offers from several merchants, then you are redirected to the shop of your choice to buy.',
                'Lynq does not sell any product: ordering, payment, delivery and after-sales service are handled by the merchant.',
            ],
        },
        {
            title: 'Where the offers come from',
            body: [
                'The offers shown come from the catalogues provided by the merchants listed on Lynq, directly or through their partners.',
                'The service is not exhaustive: only the offers of these merchants are compared. Other offers may exist elsewhere for the same product.',
            ],
        },
        {
            title: 'How offers are ranked',
            body: [
                'In product lists, products offered by the largest number of merchants appear first. You can sort by ascending or descending price at any time, and filter by category, brand or price.',
                'On a product page, offers are ranked by ascending total price, meaning the product price plus delivery costs when they are provided. Only one offer is shown per merchant: the cheapest.',
            ],
        },
        {
            title: 'Remuneration and ranking independence',
            body: [
                'Lynq may be paid by the listed merchants, through a subscription to its Google Shopping service or a commission when a purchase follows a click.',
                'This remuneration has no influence on how offers are ranked: no merchant can pay to appear ahead of another.',
            ],
        },
        {
            title: 'Prices and updates',
            body: [
                'Prices are shown including all taxes, as provided by the merchants. Delivery costs are shown when the merchant has provided them.',
                'Offers are refreshed from the merchants’ catalogues, in principle once a day. A price or availability may have changed in the meantime: only the information shown on the merchant’s website at the time of purchase is binding.',
            ],
        },
    ],
}

export default async function HowItWorksPage({ searchParams }: Props) {
    const { lang, country } = await searchParams
    const isEn = lang === 'en'
    const sections = SECTIONS[isEn ? 'en' : 'fr']

    const params = new URLSearchParams()
    if (country && /^[A-Za-z]{2}$/.test(country)) params.set('country', country)
    if (lang === 'fr' || lang === 'en') params.set('lang', lang)
    const query = params.toString()
    const contactUrl = query ? `/contact?${query}` : '/contact'

    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_40rem_at_top,theme(colors.zinc.100),white)] opacity-40 dark:bg-[radial-gradient(45rem_40rem_at_top,theme(colors.zinc.900),theme(colors.zinc.950))]" />

            <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                    {isEn ? 'Transparency' : 'Transparence'}
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                    {isEn ? 'How the ' : 'Fonctionnement '}
                    <span className="text-gradient">{isEn ? 'service works' : 'du service'}</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                    {isEn
                        ? 'Where the offers come from, how they are ranked and how Lynq is paid.'
                        : 'D’où viennent les offres, comment elles sont classées et comment Lynq est rémunéré.'}
                </p>

                <ol className="mt-12 space-y-4">
                    {sections.map((section, index) => (
                        <li
                            key={section.title}
                            className="flex gap-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:gap-6 sm:p-8"
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-black text-white dark:bg-white dark:text-zinc-900">
                                {index + 1}
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{section.title}</h2>
                                {section.body.map((paragraph) => (
                                    <p key={paragraph} className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        </li>
                    ))}
                </ol>

                <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-8 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            {isEn ? 'A question about an offer?' : 'Une question sur une offre ?'}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {isEn ? 'Write to us, we read every message.' : 'Écrivez-nous, nous lisons chaque message.'}
                        </p>
                    </div>
                    <Link
                        href={contactUrl}
                        className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
                    >
                        {isEn ? 'Contact us' : 'Nous contacter'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
