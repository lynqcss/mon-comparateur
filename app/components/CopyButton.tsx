'use client'

import { useState } from 'react'

/** Petit bouton qui copie un texte dans le presse-papiers et le confirme. */
export default function CopyButton({ value, label, copiedLabel, onDark = false }: { value: string; label: string; copiedLabel: string; onDark?: boolean }) {
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Presse-papiers indisponible : le texte reste sélectionnable à la main.
        }
    }

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={copied ? copiedLabel : label}
            title={copied ? copiedLabel : label}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                copied
                    ? 'border-[#0FA968] text-[#0FA968]'
                    : onDark
                      ? 'border-zinc-600 text-zinc-300 hover:border-white hover:text-white dark:border-zinc-300 dark:text-zinc-600 dark:hover:border-zinc-900 dark:hover:text-zinc-900'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white'
            }`}
        >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                {copied ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                    <>
                        <rect x="9" y="9" width="11" height="11" rx="2.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15V6.5A2.5 2.5 0 017.5 4H15" />
                    </>
                )}
            </svg>
            <span className="sr-only" aria-live="polite">{copied ? copiedLabel : ''}</span>
        </button>
    )
}
