'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type OnboardingSession = {
    id: string
    google_email: string
    selected_merchant_ids: string[] | null
    switch_status: string
    created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    pending_css_setup: { label: 'CSS non configuré', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    requested: { label: 'Switch demandé', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    approved: { label: 'Approuvé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    rejected: { label: 'Refusé', color: 'bg-red-50 text-red-600 border-red-200' },
}

export default function AdminOnboardingPage() {
    const [sessions, setSessions] = useState<OnboardingSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('onboarding_sessions')
            .select('id, google_email, selected_merchant_ids, switch_status, created_at')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setSessions(data)
        }
        setLoading(false)
    }

    const updateStatus = async (id: string, newStatus: string) => {
        await supabase
            .from('onboarding_sessions')
            .update({ switch_status: newStatus })
            .eq('id', id)
        fetchSessions()
    }

    const deleteSession = async (id: string) => {
        try {
            const { error } = await supabase
                .from('onboarding_sessions')
                .delete()
                .eq('id', id)
            if (error) {
                alert('Erreur suppression: ' + error.message)
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
        fetchSessions()
    }

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Demandes d&apos;onboarding</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Suivez les demandes de connexion CSS de vos clients.
                    </p>
                </div>
                <Link
                    href="/admin/merchants"
                    className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50"
                >
                    ← Marchands
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total</div>
                    <div className="mt-2 text-3xl font-black text-zinc-900">{sessions.length}</div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">En attente</div>
                    <div className="mt-2 text-3xl font-black text-amber-600">
                        {sessions.filter((s) => s.switch_status === 'pending' || s.switch_status === 'pending_css_setup').length}
                    </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Demandés</div>
                    <div className="mt-2 text-3xl font-black text-blue-600">
                        {sessions.filter((s) => s.switch_status === 'requested').length}
                    </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Approuvés</div>
                    <div className="mt-2 text-3xl font-black text-emerald-600">
                        {sessions.filter((s) => s.switch_status === 'approved').length}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
                    <h2 className="text-lg font-bold text-zinc-900">
                        Toutes les demandes ({sessions.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="text-4xl mb-4">📭</div>
                        <p className="text-zinc-500 font-medium">Aucune demande d&apos;onboarding pour le moment.</p>
                        <p className="text-xs text-zinc-400 mt-1">Les demandes apparaîtront ici quand vos clients se connecteront via l&apos;onboarding.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-zinc-100">
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Merchant IDs</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Statut</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50">
                                {sessions.map((s) => {
                                    const statusInfo = STATUS_LABELS[s.switch_status] || { label: s.switch_status, color: 'bg-zinc-50 text-zinc-600 border-zinc-200' }
                                    return (
                                        <tr key={s.id} className="group transition-colors hover:bg-zinc-50/50">
                                            <td className="px-5 py-4">
                                                <div className="text-sm font-bold text-zinc-900">{s.google_email}</div>
                                                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{s.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {s.selected_merchant_ids && s.selected_merchant_ids.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {s.selected_merchant_ids.map((mid: string) => (
                                                            <span
                                                                key={mid}
                                                                className="inline-flex rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700"
                                                            >
                                                                {mid}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-zinc-400 italic">Non sélectionnés</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-zinc-500" suppressHydrationWarning>
                                                {new Date(s.created_at).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {s.switch_status !== 'approved' && (
                                                        <button
                                                            onClick={() => updateStatus(s.id, 'approved')}
                                                            title="Marquer comme approuvé"
                                                            className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white w-8 h-8 text-emerald-500 transition-all hover:bg-emerald-50 hover:border-emerald-300"
                                                        >
                                                            ✓
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteSession(s.id)}
                                                        title="Supprimer"
                                                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white w-8 h-8 text-red-500 transition-all hover:bg-red-50 hover:border-red-300"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
