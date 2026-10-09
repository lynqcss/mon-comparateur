'use client'

import React, { useRef, useState } from 'react'
import GoogleLogo from '@/app/components/GoogleLogo'

type MockupLabels = {
    ad: string
    boosted: string
    byLynq: string
    viewOffer: string
    freeShipping: string
    shippingFee: string
    titles: readonly string[]
}

export default function GoogleShoppingMockup({ labels }: { labels: MockupLabels }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)

    const handleScroll = () => {
        if (scrollRef.current) {
            setCanScrollLeft(scrollRef.current.scrollLeft > 0)
        }
    }

    const scrollBy = (left: number) => {
        scrollRef.current?.scrollBy({ left, behavior: 'smooth' })
    }

    const ads = [
        {
            title: labels.titles[0],
            price: '2 299,99 €',
            merchant: 'topachat.com',
            shipping: labels.freeShipping,
            image: 'https://media.topachat.com/media/s400/673c6763958c922f7e7e5b30.jpg',
            reviews: '9k'
        },
        {
            title: labels.titles[1],
            price: '1 199,99 €',
            merchant: 'topachat.com',
            shipping: labels.freeShipping,
            image: 'https://media.topachat.com/media/s400/67cebea8cc2eef23de10ab6c.jpg',
            reviews: '4k'
        },
        {
            title: labels.titles[2],
            price: '1 149,99 €',
            oldPrice: '1249 €',
            merchant: 'topachat.com',
            shipping: labels.shippingFee,
            image: 'https://media.topachat.com/media/s400/67cea2be038e547c37752de6.jpg',
            reviews: '7k'
        }
    ]

    const arrowClass =
        'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition-all hover:text-zinc-900 active:scale-95 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white'

    return (
        <div className="relative isolate w-full max-w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_40px_90px_-40px_rgba(24,24,27,0.35)] dark:border-zinc-800 dark:bg-zinc-900" style={{ transform: 'translateZ(0)' }}>
            {/* Barre du navigateur */}
            <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path strokeLinecap="round" d="M8 11V8a4 4 0 018 0v3" />
                    </svg>
                    <span className="truncate">google.com/search?q=macbook</span>
                </div>
            </div>

            <div className="p-5 sm:p-7">
                {/* Logo Google + mention Lynq */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <GoogleLogo className="h-7 w-auto" />
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {labels.boosted}
                    </span>
                </div>

                <p className="mt-6 text-sm font-medium text-zinc-900 dark:text-white">{labels.ad}</p>

                <div className="group relative mt-3 w-full">
                    <div ref={scrollRef} onScroll={handleScroll} className="scrollbar-hide flex w-full gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                        {ads.map((ad, idx) => (
                            <div key={idx} className="flex w-[150px] flex-none flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sm:w-[176px]" style={{ scrollSnapAlign: 'start' }}>
                                <div className="flex aspect-square items-center justify-center bg-zinc-50 p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={ad.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                                </div>
                                <div className="flex flex-1 flex-col p-3">
                                    <h4 className="line-clamp-2 h-8 text-[12px] leading-4 text-[#1a0dab] dark:text-[#8ab4f8]">
                                        {ad.title}
                                    </h4>
                                    <div className="mt-2 flex items-baseline gap-1.5">
                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{ad.price}</span>
                                        {ad.oldPrice && <span className="text-[10px] text-zinc-400 line-through">{ad.oldPrice}</span>}
                                    </div>
                                    <div className="mt-1 truncate text-[11px] text-zinc-600 dark:text-zinc-400">{ad.merchant}</div>
                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            ))}
                                        </div>
                                        <span>({ad.reviews}+)</span>
                                    </div>
                                    <div className="mt-0.5 text-[10px] text-zinc-500">{ad.shipping}</div>

                                    <div className="mt-auto flex flex-col gap-1.5 pt-3 text-[11px] text-[#1a0dab] dark:text-[#8ab4f8]">
                                        <span>{labels.byLynq}</span>
                                        <span className="cursor-pointer hover:underline md:hidden">{labels.viewOffer}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {canScrollLeft && (
                        <div className="pointer-events-none absolute left-0 top-[38%] z-10 hidden -translate-x-1/3 sm:block">
                            <button onClick={() => scrollBy(-300)} aria-label="Précédent" className={arrowClass}>
                                <svg className="mr-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="pointer-events-none absolute right-0 top-[38%] z-10 hidden translate-x-1/3 sm:block">
                        <button onClick={() => scrollBy(300)} aria-label="Suivant" className={arrowClass}>
                            <svg className="ml-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
