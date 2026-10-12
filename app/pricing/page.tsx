import type { Metadata } from 'next'
import Link from '@/app/components/AppLink'
import FaqAccordion from '@/app/components/FaqAccordion'
import CopyButton from '@/app/components/CopyButton'
import PulseDot from '@/app/components/PulseDot'

export const metadata: Metadata = {
    title: 'Tarifs — Lynq CSS',
    description: 'Les tarifs de Lynq CSS pour les marchands : un mois d’essai gratuit, sans engagement.',
    alternates: { canonical: '/pricing' },
}

type Props = {
    searchParams: Promise<{ lang?: string; country?: string }>
}

const EMAIL = 'contact@lynq-css.com'

const COPY = {
    fr: {
        eyebrow: 'Tarifs',
        title: 'Un prix simple,',
        titleAccent: 'sans engagement',
        subtitle: 'Vous gardez vos campagnes Google Ads telles quelles. Vous commencez par un mois gratuit et vous partez quand vous voulez.',
        perMonth: '/ mois',
        trial: '1 mois d’essai gratuit',
        noCommitment: 'Sans engagement',
        plans: [
            {
                name: 'Essentiel',
                audience: 'Pour les petits budgets Google Shopping',
                price: '49 €',
                custom: false,
                features: [
                    'Diffusion de vos annonces Shopping via Lynq CSS',
                    'Jusqu’à 20 % d’économie sur vos coûts par clic',
                    'Rapport de performance mensuel',
                    'Surveillance de votre flux produits',
                    'Newsletter réservée aux marchands',
                    'Assistance par e-mail',
                ],
                cta: 'Commencer l’essai gratuit',
            },
            {
                name: 'Sur mesure',
                audience: 'Pour les budgets Google Shopping importants',
                price: 'Sur devis',
                custom: true,
                features: [
                    'Tout ce que comprend l’offre Essentiel',
                    'Un expert dédié à votre compte',
                    'Accompagnement individualisé de vos produits Shopping',
                    'Optimisation complète de vos flux Shopping',
                    'Tarif adapté à votre volume de dépenses',
                ],
                cta: 'Nous écrire',
            },
        ],
        faqTitle: 'Questions fréquentes',
        faq: [
            { q: 'Y a-t-il un engagement ?', a: 'Non. Aucune durée minimale : vous pouvez arrêter à tout moment, et le retour au CSS de Google est immédiat.' },
            { q: 'Que se passe-t-il après le mois d’essai ?', a: 'Nous faisons le point ensemble sur vos résultats. Si vous continuez, la facturation démarre ; sinon, vous arrêtez sans frais.' },
            { q: 'Dois-je modifier mes campagnes ?', a: 'Non. Vos campagnes, vos enchères, vos budgets et votre historique restent identiques. Seul le CSS associé à votre Merchant Center change.' },
            { q: 'Comment savoir quelle offre me correspond ?', a: 'Cela dépend de votre budget Google Shopping et de l’accompagnement souhaité. Écrivez-nous : nous vous répondons sous 2 h.' },
        ],
        contactTitle: 'Une question sur les tarifs ?',
        contactText: 'Écrivez-nous, nous vous répondons sous 2 h.',
        copy: 'Copier l’adresse e-mail',
        copied: 'Adresse copiée',
    },
    en: {
        eyebrow: 'Pricing',
        title: 'Simple pricing,',
        titleAccent: 'no commitment',
        subtitle: 'You keep your Google Ads campaigns exactly as they are. You start with a free month and leave whenever you want.',
        perMonth: '/ month',
        trial: '1-month free trial',
        noCommitment: 'No commitment',
        plans: [
            {
                name: 'Essential',
                audience: 'For small Google Shopping budgets',
                price: '€49',
                custom: false,
                features: [
                    'Your Shopping ads served through Lynq CSS',
                    'Up to 20% savings on your cost per click',
                    'Monthly performance report',
                    'Product feed monitoring',
                    'Merchant-only newsletter',
                    'E-mail support',
                ],
                cta: 'Start the free trial',
            },
            {
                name: 'Custom',
                audience: 'For large Google Shopping budgets',
                price: 'On request',
                custom: true,
                features: [
                    'Everything in the Essential plan',
                    'A dedicated expert on your account',
                    'One-to-one support on your Shopping products',
                    'Full optimisation of your Shopping feeds',
                    'Pricing tailored to your spend',
                ],
                cta: 'Write to us',
            },
        ],
        faqTitle: 'Frequently asked questions',
        faq: [
            { q: 'Is there a commitment?', a: 'No. There is no minimum term: you can stop at any time, and switching back to Google’s CSS is immediate.' },
            { q: 'What happens after the trial month?', a: 'We review your results together. If you continue, billing starts; otherwise you stop at no cost.' },
            { q: 'Do I need to change my campaigns?', a: 'No. Your campaigns, bids, budgets and history stay the same. Only the CSS linked to your Merchant Center changes.' },
            { q: 'How do I know which plan fits me?', a: 'It depends on your Google Shopping budget and the support you want. Write to us: we reply within 2 hours.' },
        ],
        contactTitle: 'A question about pricing?',
        contactText: 'Write to us, we reply within 2 hours.',
        copy: 'Copy the e-mail address',
        copied: 'Address copied',
    },
}

export default async function PricingPage({ searchParams }: Props) {
    const { lang } = await searchParams
    const c = COPY[lang === 'en' ? 'en' : 'fr']

    return (
        <div className="bg-white dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl px-6 pb-24 pt-16 sm:pt-20 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                        <PulseDot />
                        {c.eyebrow}
                    </p>
                    <h1 className="mt-4 text-balance text-4xl font-black leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                        {c.title} <span className="text-gradient">{c.titleAccent}</span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">{c.subtitle}</p>
                </div>

                <div className="mt-14 grid gap-6 md:grid-cols-2">
                    {c.plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`flex flex-col rounded-3xl border p-8 sm:p-10 ${
                                plan.custom
                                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                                    : 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white'
                            }`}
                        >
                            <h2 className="text-lg font-bold">{plan.name}</h2>
                            <p className={`mt-1 text-sm ${plan.custom ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}>{plan.audience}</p>

                            <p className="mt-8 flex items-baseline gap-2">
                                <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                                {plan.custom ? null : <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{c.perMonth}</span>}
                            </p>
                            <p className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-widest ${plan.custom ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                <span className="inline-flex items-center gap-1.5">
                                    <PulseDot size="h-1.5 w-1.5" />
                                    {c.trial}
                                </span>
                                <span>{c.noCommitment}</span>
                            </p>

                            <ul className="mt-8 flex-1 space-y-3 text-sm leading-6">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <svg className="mt-1 h-4 w-4 shrink-0 text-[#0FA968]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.custom ? (
                                <div className="mt-10 flex items-center gap-3">
                                    <a
                                        href={`mailto:${EMAIL}`}
                                        className="inline-flex flex-1 items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-100 active:scale-95 dark:bg-zinc-900 dark:text-white"
                                    >
                                        {plan.cta}
                                    </a>
                                    <CopyButton value={EMAIL} label={c.copy} copiedLabel={c.copied} onDark />
                                </div>
                            ) : (
                                <Link
                                    href="/onboarding"
                                    className="mt-10 inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
                                >
                                    {plan.cta}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <section className="mx-auto mt-20 max-w-3xl">
                    <h2 className="text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{c.faqTitle}</h2>
                    <div className="mt-8">
                        <FaqAccordion items={c.faq} />
                    </div>
                </section>

                <section className="mt-16 flex flex-col gap-4 rounded-3xl border border-zinc-100 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">{c.contactTitle}</h2>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{c.contactText}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <a
                            href={`mailto:${EMAIL}`}
                            className="inline-flex items-center justify-center rounded-full border border-zinc-900 px-6 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
                        >
                            {EMAIL}
                        </a>
                        <CopyButton value={EMAIL} label={c.copy} copiedLabel={c.copied} />
                    </div>
                </section>
            </div>
        </div>
    )
}
