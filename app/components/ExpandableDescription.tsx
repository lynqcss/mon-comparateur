'use client'

import { useState } from 'react'
import { getTranslation, Language } from '@/lib/i18n'

export default function ExpandableDescription({ text, lang }: { text: string; lang: string }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const t = getTranslation(lang)
    const maxLength = 350
    const isLongText = text.length > maxLength

    return (
        <div className="relative">
            <p className={`text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed transition-all duration-300 ${!isExpanded && isLongText ? 'line-clamp-4' : ''}`}>
                {text}
            </p>

            {isLongText && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white hover:underline focus:outline-none"
                >
                    {isExpanded ? t.product.read_less : t.product.read_more}
                </button>
            )}
        </div>
    )
}
