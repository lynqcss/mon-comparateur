'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

const REFRESH = 'M4 4v5h5M20 20v-5h-5M5.6 15A7 7 0 0018 17.4M18.4 9A7 7 0 006 6.6'

/** Lance une synchro manuelle, puis recharge la page (le journal montre le résultat). */
export default function SyncButton() {
    const router = useRouter()
    const [running, setRunning] = useState(false)
    const [, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    async function sync() {
        setRunning(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/gmc-accounts/sync', { method: 'POST' })
            if (res.status === 409) setError('Une synchro est déjà en cours.')
            else if (!res.ok) setError((await res.json().catch(() => null))?.error ?? `Erreur ${res.status}`)
        } catch {
            setError('Réseau indisponible.')
        } finally {
            setRunning(false)
            startTransition(() => router.refresh())
        }
    }

    return (
        <div className="flex items-center gap-3">
            {error && <span className="text-sm text-red-600">{error}</span>}
            <button
                type="button"
                onClick={sync}
                disabled={running}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
                <svg className={`h-5 w-5 ${running ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={REFRESH} />
                </svg>
                Synchroniser
            </button>
        </div>
    )
}
