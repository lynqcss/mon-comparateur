import Link from 'next/link'
import { getTranslation } from '@/lib/i18n'
import GoogleShoppingMockup from '@/app/components/GoogleShoppingMockup'
import ExpandableFAQ from '@/app/components/ExpandableFAQ'

type Props = {
    searchParams: Promise<{ lang?: string; country?: string }>
}

export default async function JoinPage({ searchParams }: Props) {
    const { lang, country } = await searchParams
    const selectedLang = lang || 'fr'
    const t = getTranslation(selectedLang)

    const buildUrl = (path: string) => {
        const sp = new URLSearchParams()
        if (lang) sp.set('lang', lang)
        if (country) sp.set('country', country)
        return `${path}?${sp.toString()}`
    }

    return (
        <div className="flex flex-col bg-white dark:bg-zinc-950">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-24 pb-32">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_50rem_at_top,theme(colors.zinc.100),white)] opacity-30 dark:bg-[radial-gradient(60rem_50rem_at_top,theme(colors.zinc.900),theme(colors.zinc.950))]" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl dark:text-white leading-[1.1]">
                            {t.join.hero_title} <span className="text-gradient inline-block">{t.join.hero_title_gradient}</span>
                        </h1>
                        <p className="mt-8 text-xl leading-8 text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl mx-auto">
                            {t.join.hero_subtitle}
                        </p>
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
                            <Link href="/onboarding" className="rounded-full bg-zinc-900 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 dark:bg-white dark:text-zinc-900">
                                {t.join.cta_primary}
                            </Link>
                            <a href="#benefits" className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:underline">
                                {t.join.cta_secondary} ↓
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 bg-zinc-50/50 dark:bg-zinc-900/20 shadow-inner">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl uppercase tracking-widest">
                            {t.join.benefits_title}
                        </h2>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {[
                            { title: t.join.benefit1_title, desc: t.join.benefit1_desc, icon: '🚀' },
                            { title: t.join.benefit2_title, desc: t.join.benefit2_desc, icon: '🛡️' },
                            { title: t.join.benefit3_title, desc: t.join.benefit3_desc, icon: '📊' },
                        ].map((benefit, idx) => (
                            <div key={idx} className="group relative rounded-3xl border border-zinc-100 bg-white p-10 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 dark:border-zinc-800 dark:bg-zinc-900/50">
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-3xl shadow-sm group-hover:scale-110 transition-transform dark:bg-zinc-800">
                                    {benefit.icon}
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{benefit.title}</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="py-32 overflow-hidden">
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
                        </div>
                        <div className="relative w-full overflow-hidden sm:overflow-visible">
                            <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200/50 to-transparent rounded-full blur-3xl -z-10" />
                            <div className="origin-center lg:origin-right transition-transform duration-500 hover:scale-[1.02] w-full max-w-full overflow-hidden">
                                <GoogleShoppingMockup />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-24 bg-zinc-50/30 dark:bg-zinc-900/10">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <h2 className="text-center text-3xl font-black mb-16 dark:text-white uppercase tracking-widest">{t.join.faq_title}</h2>
                    <div className="space-y-8">
                        {[
                            { q: t.join.faq_q1, a: t.join.faq_a1 },
                            { q: t.join.faq_q2, a: t.join.faq_a2 },
                            { q: t.join.faq_q3, a: t.join.faq_a3 },
                        ].map((item, idx) => (
                            <ExpandableFAQ key={idx} question={item.q} answer={item.a} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32">
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
