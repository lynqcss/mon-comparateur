'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

type Merchant = {
  id: number
  gmc_id: string
  name: string
  website_url: string
  default_category: string | null
  last_import_at: string | null
  last_import_status: 'success' | 'error' | null
  last_import_count: number | null
  last_import_message: string | null
  sync_paused: boolean
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    gmc_id: '',
    name: '',
    website_url: '',
    default_category: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [merchantToDelete, setMerchantToDelete] = useState<Merchant | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'status' | 'sync_date' | 'product_count' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const filteredAndSortedMerchants = useMemo(() => {
    let result = merchants

    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase()
      result = result.filter(
        (m) => m.name?.toLowerCase().includes(lowerQ) || m.gmc_id?.toLowerCase().includes(lowerQ)
      )
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        if (sortField === 'product_count') {
          const aCount = a.last_import_count ?? 0
          const bCount = b.last_import_count ?? 0
          return sortOrder === 'asc' ? aCount - bCount : bCount - aCount
        }
        if (sortField === 'sync_date') {
          const aTime = a.last_import_at ? new Date(a.last_import_at).getTime() : 0
          const bTime = b.last_import_at ? new Date(b.last_import_at).getTime() : 0
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime
        }
        if (sortField === 'status') {
          const getStatusWeight = (m: Merchant) => {
            if (m.sync_paused) return 0
            if (m.last_import_status === 'error') return 1
            if (m.last_import_status === 'success') return 3
            return 2 // Jamais
          }
          const aWeight = getStatusWeight(a)
          const bWeight = getStatusWeight(b)
          return sortOrder === 'asc' ? aWeight - bWeight : bWeight - aWeight
        }
        return 0
      })
    }

    return result
  }, [merchants, searchQuery, sortField, sortOrder])

  const handleSort = (field: 'status' | 'sync_date' | 'product_count') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const fetchMerchants = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/merchants')
      const data = await res.json()
      setMerchants(data)
    } catch (e) {
      console.error(e)
      setError('Impossible de charger les marchands')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMerchants()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.gmc_id || !form.name || !form.website_url) {
      setError('Merci de remplir au minimum GMC ID, Nom et Site Web')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la creation')
        return
      }

      const newMerchant = await res.json()
      setMerchants((prev) => [newMerchant, ...prev])
      setForm({ gmc_id: '', name: '', website_url: '', default_category: '' })
    } catch (e) {
      console.error(e)
      setError('Erreur reseau')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (merchantId: number) => {
    setError(null)
    setSyncingId(merchantId)
    try {
      const res = await fetch('/api/gmc/sync?merchantId=' + merchantId)
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Erreur lors de la synchronisation')
        return
      }
      await fetchMerchants()
    } catch (err) {
      console.error(err)
      setError('Erreur reseau pendant la synchronisation')
    } finally {
      setSyncingId(null)
    }
  }

  const handleDelete = async (merchant: Merchant) => {
    setError(null)
    setDeletingId(merchant.id)
    setMerchantToDelete(null) // Close modal immediately

    try {
      const res = await fetch('/api/merchants?id=' + merchant.id, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Erreur lors de la suppression')
        return
      }
      setMerchants((prev) => prev.filter((m) => m.id !== merchant.id))
    } catch (err) {
      console.error(err)
      setError('Erreur reseau pendant la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  const handleTogglePause = async (merchant: Merchant) => {
    setTogglingId(merchant.id)
    setError(null)
    try {
      const res = await fetch('/api/merchants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: merchant.id, sync_paused: !merchant.sync_paused }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Erreur lors du changement')
        return
      }
      setMerchants((prev) =>
        prev.map((m) => (m.id === merchant.id ? { ...m, sync_paused: !m.sync_paused } : m))
      )
    } catch (err) {
      console.error(err)
      setError('Erreur reseau')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Admin CSS</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Gerez vos marchands partenaires et synchronisez leurs catalogues produits.</p>
        </div>
        <Link
          href="/admin/onboarding"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md"
        >
          📋 Demandes d&apos;onboarding
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Marchands</div>
          <div className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{merchants.length}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Produits Synchronises</div>
          <div className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">
            {merchants.reduce((sum, m) => sum + (m.last_import_count || 0), 0).toLocaleString('fr-FR')}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Synchros en cours</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-black text-zinc-900 dark:text-white">
              {syncingId !== null ? 1 : 0}
            </span>
            {syncingId !== null && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Form Column */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="mb-5 text-lg font-bold text-zinc-900 dark:text-white">Nouveau Marchand</h2>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/10">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Attention</span>
                </div>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">GMC ID</label>
                <input
                  name="gmc_id"
                  value={form.gmc_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                  placeholder="ex: 123456789"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nom du Marchand</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                  placeholder="ex: Boutique de test"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">URL du site</label>
                <input
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                  placeholder="https://..."
                />
              </div>

              <div className="text-xs text-zinc-400 italic pt-1">
                Champs obligatoires pour la conformite Google CSS.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-95 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
              >
                {loading ? 'Creation...' : 'Ajouter le Marchand'}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Marchands Enregistres
                <span className="ml-2 text-sm font-normal text-zinc-400">({filteredAndSortedMerchants.length})</span>
              </h2>
              <button onClick={fetchMerchants} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Rafraichir</button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou GMC ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                />
              </div>
            </div>
          </div>

          <div>
            <table className="w-full table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="w-[120px] px-3 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">ID</th>
                  <th className="px-3 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Marchand</th>
                  <th
                    className="w-[80px] px-3 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-center cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('product_count')}
                  >
                    Prod. {sortField === 'product_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="w-[120px] px-3 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('sync_date')}
                  >
                    Synchro {sortField === 'sync_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="w-[90px] px-3 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-center cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="w-[150px] px-3 pr-5 py-3 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {filteredAndSortedMerchants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center text-zinc-400">Aucun marchand trouve</td>
                  </tr>
                ) : (
                  filteredAndSortedMerchants.map((m) => (
                    <tr key={m.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="px-3 py-3">
                        <div className="font-bold text-zinc-900 dark:text-white text-xs">#{m.id}</div>
                        <div className="text-[10px] text-zinc-400 break-all">{m.gmc_id}</div>
                      </td>
                      <td className="px-3 py-3 overflow-hidden">
                        <Link href={'/admin/merchants/' + m.id} className="font-bold text-zinc-900 dark:text-white text-xs truncate block hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {m.name}
                        </Link>
                        <a href={m.website_url} target="_blank" className="text-[10px] text-zinc-400 hover:text-zinc-900 hover:underline truncate block">{m.website_url}</a>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {m.last_import_count ?? 0}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-[11px] text-zinc-500" suppressHydrationWarning>
                          {m.last_import_at ? new Date(m.last_import_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Jamais'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {m.sync_paused ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                            Pause
                          </span>
                        ) : m.last_import_status === 'success' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            OK
                          </span>
                        ) : m.last_import_status === 'error' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-600 dark:bg-red-950/30 dark:text-red-400">
                            Erreur
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 pr-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              handleTogglePause(m)
                            }}
                            disabled={togglingId === m.id}
                            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white w-8 h-8 text-zinc-500 transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            title={m.sync_paused ? 'Reprendre la synchro' : 'Mettre en pause'}
                          >
                            {m.sync_paused ? (
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            )}
                          </button>
                          {/* Sync */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              handleSync(m.id)
                            }}
                            disabled={syncingId === m.id || deletingId === m.id || m.sync_paused}
                            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 w-8 h-8 text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                            title="Synchroniser"
                          >
                            {syncingId === m.id ? (
                              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            )}
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setMerchantToDelete(m)
                            }}
                            disabled={deletingId === m.id || syncingId === m.id}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white w-8 h-8 text-red-500 transition-all hover:bg-red-50 hover:border-red-300 disabled:opacity-50 dark:border-red-900/50 dark:bg-zinc-900 dark:hover:bg-red-950/20"
                            title="Supprimer le marchand et ses produits"
                          >
                            {deletingId === m.id ? (
                              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modern Delete Modal */}
      {merchantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-sm transition-opacity dark:bg-black/60">
          <div className="w-full max-w-md scale-100 rounded-2xl bg-white p-6 shadow-2xl transition-transform dark:bg-zinc-900 dark:border dark:border-zinc-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Supprimer {merchantToDelete.name} ?
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Cette action supprimera definitivement le marchand ainsi que <strong>tous ses produits</strong> de la base de donnees. Cette action est irreversible.
            </p>
            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMerchantToDelete(null)}
                className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleDelete(merchantToDelete)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-red-700 active:scale-95"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

