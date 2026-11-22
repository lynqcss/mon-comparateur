'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Œil barré = exclure ; œil = réintégrer.
const EYE_OFF = 'M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7a12.6 12.6 0 01-3.1 4.2M6.1 6.1C3.9 7.5 2.5 9.6 2 12c1 2.5 5 7 10 7 1.6 0 3.1-.4 4.4-1.1'
const EYE = 'M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z'

/** Icône d'action : exclure un compte du périmètre (marketplace…) ou le réintégrer. */
export default function ExcludeToggle({ accountId, excluded, locked }: { accountId: string; excluded: boolean; locked: boolean }) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)

    const label = locked ? 'MCA : exclu d’office' : excluded ? 'Réintégrer dans la surveillance' : 'Exclure de la surveillance'

    async function toggle() {
        setBusy(true)
        try {
            const res = await fetch(`/api/admin/gmc-accounts/${accountId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ excluded: !excluded }),
            })
            if (!res.ok) alert((await res.json().catch(() => null))?.error ?? `Erreur ${res.status}`)
        } finally {
            setBusy(false)
            router.refresh()
        }
    }

    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={toggle}
            disabled={busy || locked}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={excluded ? EYE : EYE_OFF} />
            </svg>
        </button>
    )
}
