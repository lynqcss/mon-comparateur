import type { Metadata } from 'next'
import Link from '@/app/components/AppLink'

export const metadata: Metadata = {
    title: 'Contact — Lynq CSS',
    alternates: { canonical: '/contact' },
}

type Props = {
    searchParams: Promise<{ lang?: string; country?: string }>
}

const EMAIL = 'contact@lynq-css.com'

export default async function ContactPage({ searchParams }: Props) {
    const { lang, country } = await searchParams
    const isEn = lang === 'en'

    const joinParams = new URLSearchParams()
    if (country && /^[A-Za-z]{2}$/.test(country)) joinParams.set('country', country)
    if (lang === 'fr' || lang === 'en') joinParams.set('lang', lang)
    const joinQuery = joinParams.toString()
    const joinUrl = joinQuery ? `/join?${joinQuery}` : '/join'

    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_40rem_at_top,theme(colors.zinc.100),white)] opacity-40 dark:bg-[radial-gradient(45rem_40rem_at_top,theme(colors.zinc.900),theme(colors.zinc.950))]" />

            <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                    {isEn ? 'Customer service' : 'Service client'}
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                    {isEn ? 'Contact ' : 'Contactez-'}<span className="text-gradient">{isEn ? 'us' : 'nous'}</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                    {isEn
                        ? 'A question about an offer, a merchant or our comparison service? Write to us, we read every message.'
                        : 'Une question sur une offre, un marchand ou notre service de comparaison ? Écrivez-nous, nous lisons chaque message.'}
                </p>

                <div className="mt-12 grid gap-4 sm:grid-cols-2">
                    <a
                        href={`mailto:${EMAIL}`}
                        className="group flex items-center gap-6 rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-transform group-hover:scale-105 dark:bg-white dark:text-zinc-900">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">E-mail</h2>
                            <p className="mt-1 break-all text-lg font-bold text-zinc-900 underline decoration-zinc-200 underline-offset-4 group-hover:decoration-zinc-900 dark:text-white dark:decoration-zinc-700 dark:group-hover:decoration-white">
                                {EMAIL}
                            </p>
                        </div>
                    </a>

                    <div className="flex items-center gap-6 rounded-2xl border border-zinc-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-900 dark:bg-zinc-800 dark:text-white">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                                {isEn ? 'Address' : 'Adresse'}
                            </h2>
                            <address className="mt-1 text-base font-bold not-italic leading-6 text-zinc-900 dark:text-white">
                                Lynq CSS
                                <br />
                                9 cours du Médoc
                                <br />
                                33300 Bordeaux, France
                            </address>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-8 dark:border-zinc-800 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                            {isEn ? 'Are you a merchant?' : 'Vous êtes marchand ?'}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            {isEn
                                ? 'Find out how to list your products on Lynq.'
                                : 'Découvrez comment diffuser vos produits sur Lynq.'}
                        </p>
                    </div>
                    <Link
                        href={joinUrl}
                        className="inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900"
                    >
                        {isEn ? 'List on Lynq' : 'Diffuser sur Lynq'}
                    </Link>
                </div>
            </div>
        </div>
    )
}
