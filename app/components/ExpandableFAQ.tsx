'use client'

import { useState } from 'react'

type FAQItemProps = {
    question: string
    answer: string
}

export default function ExpandableFAQ({ question, answer }: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="rounded-2xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center justify-between p-8 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{question}</h3>
                <span className={`ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-8 pt-0 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    )
}
