'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getTranslation } from '@/lib/i18n'

export default function SortDropdown() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const lang = searchParams.get('lang') || 'fr'
    const t = getTranslation(lang)
    const currentSort = searchParams.get('sort') || ''

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        const params = new URLSearchParams(searchParams.toString())

        if (val) {
            params.set('sort', val)
        } else {
            params.delete('sort')
        }

        params.set('page', '1')

        router.push(`/products?${params.toString()}`)
    }

    return (
        <div className="relative group">
            <select
                onChange={handleSortChange}
                value={currentSort}
                className="appearance-none rounded-full border border-zinc-200 bg-white px-6 py-2 pr-10 text-xs font-bold uppercase tracking-widest text-zinc-900 outline-none transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white cursor-pointer"
            >
                <option value="">{t.products.sort_by}</option>
                <option value="price_asc">{t.products.sort_asc}</option>
                <option value="price_desc">{t.products.sort_desc}</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    )
}
