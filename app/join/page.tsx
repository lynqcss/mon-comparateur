import Link from '@/app/components/AppLink'
import { getTranslation } from '@/lib/i18n'
import GoogleShoppingMockup from '@/app/components/GoogleShoppingMockup'
import AuctionMechanism from '@/app/components/AuctionMechanism'
import FaqAccordion from '@/app/components/FaqAccordion'

type Props = {
    searchParams: Promise<{ lang?: string; country?: string }>
}

export default async function JoinPage({ searchParams }: Props) {
    const { lang } = await searchParams
    const selectedLang = lang || 'fr'
    const t = getTranslation(selectedLang)
    const isEn = selectedLang === 'en'

    return (
        <div className="flex flex-col bg-white dark:bg-zinc-950">
            {/* Hero Section */}
            <section className="relative pb-12 pt-16 sm:pt-20">
                <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(60rem_30rem_at_top,theme(colors.zinc.100),transparent)] opacity-60 dark:bg-[radial-gradient(60rem_30rem_at_top,theme(colors.zinc.900),transparent)]" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0FA968] opacity-60 motion-reduce:hidden" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0FA968]" />
                            </span>
                            {isEn ? 'For merchants' : 'Pour les marchands'}
                        </p>
                        <h1 className="text-balance text-4xl font-black leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
                            {t.join.hero_title} <span className="text-gradient">{t.join.hero_title_gradient}</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                            {t.join.hero_subtitle}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
                            <Link href="/onboarding" className="rounded-full bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900">
                                {t.join.cta_primary}
                            </Link>
                            <a href="#benefits" className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
                                {t.join.cta_secondary}
                                <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-6-6l6 6 6-6" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="scroll-mt-24 py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
                        {t.join.benefits_title}
                    </h2>

                    <div className="mt-12 grid gap-5 md:grid-cols-2">
                        {[
                            { title: t.join.benefit1_title, desc: t.join.benefit1_desc, icon: 'M4 7l6 6 4-4 6 7m0 0v-5m0 5h-5' },
                            { title: t.join.benefit2_title, desc: t.join.benefit2_desc, icon: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zm-3 9l2 2 4-4' },
                            { title: t.join.benefit3_title, desc: t.join.benefit3_desc, icon: 'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3' },
                            { title: t.join.benefit4_title, desc: t.join.benefit4_desc, icon: 'M4 13v-1a8 8 0 0116 0v1m-16 0a2 2 0 012-2h1v6H6a2 2 0 01-2-2zm16 0a2 2 0 00-2-2h-1v6h1a2 2 0 002-2zm0 2v1a4 4 0 01-4 4h-3' },
                        ].map((benefit, idx) => (
                            <div key={idx} className="group relative rounded-3xl border border-zinc-200/70 bg-white p-8 transition-all hover:-translate-y-1.5 hover:border-[#0FA968] hover:shadow-[0_30px_60px_-30px_rgba(24,24,27,0.25)] dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-10">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 transition-colors group-hover:bg-[#0FA968] group-hover:text-white dark:bg-zinc-800 dark:text-white">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={benefit.icon} />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{benefit.title}</h3>
                                <p className="mt-3 leading-7 text-zinc-600 dark:text-zinc-400">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Auction Mechanism Section */}
            <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <AuctionMechanism lang={selectedLang} />
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-12">
                                {t.join.steps_title}
                            </h2>
                            <div className="space-y-10">
                                {[
                                    { title: t.join.step1_title, desc: t.join.step1_desc, num: '01' },
                                    { title: t.join.step2_title, desc: t.join.step2_desc, num: '02' },
                                    { title: t.join.step3_title, desc: t.join.step3_desc, num: '03' },
                                ].map((step, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                        <div className="text-4xl font-black text-zinc-100 dark:text-zinc-800 select-none shrink-0 border-b-2 sm:border-b-0 border-zinc-100 dark:border-zinc-800 pb-2 sm:pb-0 w-fit">
                                            {step.num}
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2">{step.title}</h3>
                                            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 font-medium break-words leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 flex justify-center">
                                <Link href="/onboarding" className="rounded-full bg-zinc-900 px-8 py-4 text-base font-bold text-white shadow-2xl transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900">
                                    {t.join.steps_cta}
                                </Link>
                            </div>
                        </div>
                        <div className="relative w-full sm:overflow-visible">
                            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200/50 to-transparent rounded-full blur-3xl -z-10" />
                            <div className="origin-center lg:origin-right transition-transform duration-500 hover:scale-[1.02] w-full max-w-full">
                                <GoogleShoppingMockup labels={t.mockup} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 sm:py-20">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{t.join.faq_title}</h2>
                    <div className="mt-12">
                        <FaqAccordion
                            items={[
                                { q: t.join.faq_q1, a: t.join.faq_a1 },
                                { q: t.join.faq_q2, a: t.join.faq_a2 },
                                { q: t.join.faq_q3, a: t.join.faq_a3 },
                                { q: t.join.faq_q4, a: t.join.faq_a4 },
                                { q: t.join.faq_q5, a: t.join.faq_a5 },
                                { q: t.join.faq_q6, a: t.join.faq_a6 },
                                { q: t.join.faq_q7, a: t.join.faq_a7 },
                                { q: t.join.faq_q8, a: t.join.faq_a8 },
                                { q: t.join.faq_q9, a: t.join.faq_a9 },
                                { q: t.join.faq_q10, a: t.join.faq_a10 },
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 px-8 py-24 text-center shadow-2xl dark:bg-white sm:px-16">
                        <h2 className="text-3xl font-black tracking-tight text-white dark:text-zinc-900 sm:text-5xl">
                            Prêt à faire passer vos campagnes <br className="hidden sm:block" /> au niveau supérieur ?
                        </h2>
                        <div className="mt-12 flex flex-col items-center gap-6">
                            <Link href="/onboarding" className="rounded-full bg-white px-12 py-5 text-lg font-bold text-zinc-900 shadow-xl transition-all hover:bg-zinc-100 hover:scale-105 active:scale-95 dark:bg-zinc-900 dark:text-white">
                                {t.join.cta_primary}
                            </Link>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Support expert inclus
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
