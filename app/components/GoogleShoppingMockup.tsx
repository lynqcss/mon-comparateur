'use client'

import React from 'react'

export default function GoogleShoppingMockup() {
    const ads = [
        {
            title: 'Perceuse visseuse 18V',
            price: '109,99 €',
            merchant: 'bricopro.fr',
            shipping: 'Livraison gratuite',
            image: 'https://images.unsplash.com/photo-1504148455328-497c5ef215d0?q=80&w=300&auto=format&fit=crop'
        },
        {
            title: 'Pack 2 batteries Li-Ion',
            price: '89,00 €',
            merchant: 'masteroutils.com',
            shipping: '+ 4,99 € de frais',
            image: 'https://images.unsplash.com/photo-1555854816-6aa6143c7270?q=80&w=300&auto=format&fit=crop'
        },
        {
            title: 'Perceuse à percussion',
            price: '159,00 €',
            oldPrice: '179 €',
            merchant: 'manomano.fr',
            shipping: 'Livraison gratuite',
            image: 'https://images.unsplash.com/photo-1513694490325-24d193d80634?q=80&w=300&auto=format&fit=crop'
        }
    ]

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Search Header Mockup */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-8 flex items-center px-4">
                    <div className="text-xs text-zinc-400 font-medium">google.com/search?q=perceuse+visseuse</div>
                </div>
            </div>

            <div className="p-8">
                <div className="flex items-center gap-2 mb-6 text-sm">
                    <span className="font-bold text-zinc-900 dark:text-white">Annonce</span>
                    <span className="text-zinc-400">Shopping</span>
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-2" />
                    <span className="text-zinc-500 italic">Boosté par Lynq CSS</span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {ads.map((ad, idx) => (
                        <div key={idx} className="min-w-[180px] w-[180px] flex flex-col rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                            <div className="aspect-square bg-white p-4">
                                <img src={ad.image} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div className="p-3 bg-white dark:bg-zinc-950 flex flex-col flex-1">
                                <h4 className="text-[11px] font-medium leading-normal text-zinc-700 dark:text-zinc-300 line-clamp-2 h-8">
                                    {ad.title}
                                </h4>
                                <div className="mt-2 flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-zinc-900 dark:text-white">{ad.price}</span>
                                    {ad.oldPrice && <span className="text-[10px] text-zinc-400 line-through">{ad.oldPrice}</span>}
                                </div>
                                <div className="mt-1 text-[10px] text-zinc-500 truncate">{ad.merchant}</div>
                                <div className="text-[10px] text-zinc-400">{ad.shipping}</div>

                                <div className="mt-auto pt-3 border-t border-zinc-50 dark:border-zinc-800">
                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        Par Lynq
                                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Mockup Arrow */}
                    <div className="flex-none flex items-center pl-4 pr-2">
                        <div className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 bg-white dark:bg-zinc-900 shadow-sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
