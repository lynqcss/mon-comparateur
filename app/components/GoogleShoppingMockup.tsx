'use client'

import React, { useRef, useState } from 'react'

export default function GoogleShoppingMockup() {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)

    const handleScroll = () => {
        if (scrollRef.current) {
            setCanScrollLeft(scrollRef.current.scrollLeft > 0)
        }
    }

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    }

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    }

    const ads = [
        {
            title: 'Apple MacBook Pro M4 Pro 14" (2024) - Noir sidéral...',
            price: '2 299,99 €',
            merchant: 'topachat.com',
            shipping: 'Livraison gratuite',
            image: 'https://media.topachat.com/media/s400/673c6763958c922f7e7e5b30.jpg',
            reviews: '9k'
        },
        {
            title: 'Apple MacBook Air M4 15 pouces (2025) - Minuit - 16 Go',
            price: '1 199,99 €',
            merchant: 'topachat.com',
            shipping: 'Livraison gratuite',
            image: 'https://media.topachat.com/media/s400/67cebea8cc2eef23de10ab6c.jpg',
            reviews: '4k'
        },
        {
            title: 'Apple MacBook Air M4 13 pouces (2025) - Bleu Ciel - 16 Go',
            price: '1 149,99 €',
            oldPrice: '1249 €',
            merchant: 'topachat.com',
            shipping: '+ 4,99 € de frais',
            image: 'https://media.topachat.com/media/s400/67cea2be038e547c37752de6.jpg',
            reviews: '7k'
        }
    ]

    return (
        <div className="w-full max-w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative isolate" style={{ transform: 'translateZ(0)' }}>
            {/* Search Header Mockup */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-8 flex items-center px-4">
                    <div className="text-xs text-zinc-400 font-medium truncate">google.com/search?q=macbook</div>
                </div>
            </div>

            <div className="p-8">
                <div className="flex items-center gap-2 mb-6 text-sm">
                    <span className="font-bold text-zinc-900 dark:text-white">Annonce</span>
                    <span className="text-zinc-400">Shopping</span>
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2" />
                    <span className="text-zinc-500 italic">Boosté par Lynq CSS</span>
                </div>

                <div className="relative group w-full">
                    <div ref={scrollRef} onScroll={handleScroll} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide w-full" style={{ scrollSnapType: 'x mandatory' }}>
                        {ads.map((ad, idx) => (
                            <div key={idx} className="flex-none w-[140px] sm:w-[180px] flex flex-col rounded-[16px] border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950" style={{ scrollSnapAlign: 'start' }}>
                                <div className="aspect-square bg-white flex items-center justify-center p-4">
                                    <img src={ad.image} alt="" className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm" />
                                </div>
                                <div className="p-3 bg-white dark:bg-zinc-950 flex flex-col flex-1 border-t border-zinc-100 dark:border-zinc-800">
                                    <h4 className="text-[11px] font-medium leading-normal text-zinc-700 dark:text-zinc-300 line-clamp-2 h-8">
                                        {ad.title}
                                    </h4>
                                    <div className="mt-2 flex items-baseline gap-1.5">
                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{ad.price}</span>
                                        {ad.oldPrice && <span className="text-[10px] text-zinc-400 line-through">{ad.oldPrice}</span>}
                                    </div>
                                    <div className="mt-1 text-[10px] text-zinc-500 truncate">{ad.merchant}</div>
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                            ))}
                                        </div>
                                        <span>({ad.reviews}+)</span>
                                    </div>
                                    <div className="mt-0.5 text-[10px] text-zinc-400">{ad.shipping}</div>

                                    <div className="mt-auto pt-3 flex flex-col gap-2">
                                        <div className="text-[11px] sm:text-xs text-[#1a0dab] dark:text-[#8ab4f8]">
                                            Par Lynq
                                        </div>
                                        <div className="md:hidden text-[11px] sm:text-xs text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer">
                                            Voir l'offre
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Left Mockup Arrow */}
                    {canScrollLeft && (
                        <div className="absolute left-0 top-[40%] md:-translate-x-1/2 flex items-center justify-center z-10 hidden sm:flex pointer-events-none">
                            <button
                                onClick={scrollLeft}
                                className="pointer-events-auto w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 bg-white dark:bg-zinc-800 shadow-md transition-all active:scale-95 focus:outline-none cursor-pointer"
                            >
                                <svg className="w-4 h-4 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Right Mockup Arrow */}
                    <div className="absolute right-0 top-[40%] md:translate-x-1/2 flex items-center justify-center z-10 hidden sm:flex pointer-events-none">
                        <button
                            onClick={scrollRight}
                            className="pointer-events-auto w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 bg-white dark:bg-zinc-800 shadow-md transition-all active:scale-95 focus:outline-none cursor-pointer"
                        >
                            <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
