'use client'

import { useEffect, useState } from 'react'

type Merchant = {
  id: number
  gmc_id: string
  name: string
  website_url: string
  default_category: string | null
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
        setError(data.error || 'Erreur lors de la création')
        return
      }

      const newMerchant = await res.json()
      setMerchants((prev) => [newMerchant, ...prev])
      setForm({ gmc_id: '', name: '', website_url: '', default_category: '' })
    } catch (e) {
      console.error(e)
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (merchantId: number) => {
    setError(null)
    setSyncingId(merchantId)
    try {
      const res = await fetch(`/api/gmc/sync?merchantId=${merchantId}`)
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setError(data?.message || 'Erreur lors de la synchronisation')
        return
      }
      await fetchMerchants()
    } catch (err) {
      console.error(err)
      setError('Erreur réseau pendant la synchronisation')
    } finally {
      setSyncingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Admin CSS</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Gérez vos marchands partenaires et synchronisez leurs catalogues produits.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Form Column */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">Nouveau Marchand</h2>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/10">
                <div className="flex items-center gap-2 font-bold">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Attention</span>
                </div>
                <p className="mt-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">GMC ID</label>
                <input
                  name="gmc_id"
                  value={form.gmc_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                  placeholder="ex: 123456789"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nom du Marchand</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                  placeholder="ex: Boutique de test"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">URL du site</label>
                <input
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white dark:focus:ring-white"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-1 text-xs text-zinc-400 italic mb-4">
                Les champs sont obligatoires pour la conformité Google CSS.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-95 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
              >
                {loading ? 'Création...' : 'Ajouter le Marchand'}
              </button>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="border-b border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Marchands Enregistrés</h2>
              <button onClick={fetchMerchants} className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Rafraîchir</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">ID / GMC</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Marchand</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {merchants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">Aucun marchand enregistré</td>
                  </tr>
                ) : (
                  merchants.map((m) => (
                    <tr key={m.id} className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">#{m.id}</div>
                        <div className="text-xs text-zinc-400">{m.gmc_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{m.name}</div>
                        <a href={m.website_url} target="_blank" className="text-xs text-zinc-400 hover:text-zinc-900 hover:underline">{m.website_url}</a>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Actif
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleSync(m.id)}
                          disabled={syncingId === m.id || loading}
                          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                        >
                          {syncingId === m.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Sync...
                            </span>
                          ) : 'Synchroniser'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
