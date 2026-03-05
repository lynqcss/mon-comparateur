'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Merchant = {
    id: number
    gmc_id: string
    name: string
    website_url: string
    sync_paused: boolean
    last_import_at: string | null
    last_import_status: string | null
    last_import_count: number | null
    last_import_message: string | null
}

type SyncLog = {
    id: number
    merchant_id: number
    product_count: number
    status: string
    duration_ms: number
    message: string | null
    created_at: string
}

export default function MerchantDetailPage() {
    const params = useParams()
    const merchantId = params.id as string

    const [merchant, setMerchant] = useState<Merchant | null>(null)
    const [logs, setLogs] = useState<SyncLog[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchData = async () => {
        try {
            setLoading(true)
            // Fetch merchant
            const mRes = await fetch('/api/merchants/' + merchantId)
            if (!mRes.ok) throw new Error('Marchand introuvable')
            const mData = await mRes.json()
            setMerchant(mData.merchant)
            setLogs(mData.logs)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [merchantId])

    const handleSync = async () => {
        if (!merchant) return
        setSyncing(true)
        setError(null)
        try {
            const res = await fetch('/api/gmc/sync?merchantId=' + merchant.id)
            const data = await res.json()
            if (!data.success) {
                setError(data.message || 'Erreur de synchronisation')
            }
            await fetchData()
        } catch (err) {
            setError('Erreur reseau')
        } finally {
            setSyncing(false)
        }
    }

    const formatDuration = (ms: number) => {
        if (ms < 1000) return ms + 'ms'
        return (ms / 1000).toFixed(1) + 's'
    }

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="animate-pulse text-zinc-400">Chargement...</div>
            </div>
        )
    }

    if (!merchant) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="text-red-500">{error || 'Marchand introuvable'}</div>
                <Link href="/admin/merchants" className="mt-4 inline-block text-sm text-zinc-500 hover:text-zinc-900">
                    &larr; Retour
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/merchants" className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
                    &larr; Retour aux marchands
                </Link>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{merchant.name}</h1>
                        <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                            <span>GMC ID: {merchant.gmc_id}</span>
                            <a
                                href={`https://merchants.google.com/mc/dashboard?a=${merchant.gmc_id}`}
                                target="_blank"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white transition-colors"
                                title="Ouvrir dans Google Merchant Center"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                            <span className="text-zinc-300 dark:text-zinc-700">&middot;</span>
                            <a href={merchant.website_url} target="_blank" className="hover:underline">{merchant.website_url}</a>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={
                            merchant.sync_paused
                                ? 'rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600'
                                : merchant.last_import_status === 'success'
                                    ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600'
                                    : merchant.last_import_status === 'error'
                                        ? 'rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600'
                                        : 'rounded-full bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-400'
                        }>
                            {merchant.sync_paused ? 'En pause' : merchant.last_import_status === 'success' ? 'Actif' : merchant.last_import_status === 'error' ? 'Erreur' : 'Jamais synchronise'}
                        </span>
                        <button
                            onClick={handleSync}
                            disabled={syncing || merchant.sync_paused}
                            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                        >
                            {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Produits</div>
                    <div className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{merchant.last_import_count ?? 0}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Derniere synchro</div>
                    <div className="mt-2 text-lg font-bold text-zinc-900 dark:text-white" suppressHydrationWarning>
                        {merchant.last_import_at
                            ? new Date(merchant.last_import_at).toLocaleDateString('fr-FR', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })
                            : 'Jamais'}
                    </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total synchros (30j)</div>
                    <div className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{logs.length}</div>
                </div>
            </div>

            {/* Sync Logs Table */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                        Historique des synchronisations
                        <span className="ml-2 text-sm font-normal text-zinc-400">(30 derniers jours)</span>
                    </h2>
                </div>

                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            <th className="px-5 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Date</th>
                            <th className="px-5 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-center">Produits</th>
                            <th className="px-5 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-center">Duree</th>
                            <th className="px-5 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-center">Status</th>
                            <th className="px-5 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-zinc-400">
                                    Aucun log de synchronisation
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                                    <td className="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400" suppressHydrationWarning>
                                        {new Date(log.created_at).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-5 py-3 text-center text-sm font-medium text-zinc-900 dark:text-white">
                                        {log.product_count}
                                    </td>
                                    <td className="px-5 py-3 text-center text-xs text-zinc-500">
                                        {formatDuration(log.duration_ms)}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        {log.status === 'success' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                                                OK
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-600">
                                                Erreur
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-xs text-zinc-400 truncate max-w-[200px]">
                                        {log.message || '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
