import { supabase } from '@/lib/supabaseClient'

// Coordonnées de prospects : jamais mises en cache.
export const dynamic = 'force-dynamic'

type Lead = {
    id: string
    created_at: string
    name: string
    email: string
    website: string | null
    gmc_id: string
    monthly_budget: string | null
    message: string | null
}

const BUDGET_LABELS: Record<string, string> = {
    lt1k: 'Moins de 1 000 €',
    '1k-10k': '1 000 à 10 000 €',
    '10k-50k': '10 000 à 50 000 €',
    gt50k: 'Plus de 50 000 €',
}

export default async function AdminLeadsPage() {
    const { data, error } = await supabase
        .from('merchant_leads')
        .select('id, created_at, name, email, website, gmc_id, monthly_budget, message')
        .order('created_at', { ascending: false })
        .limit(500)
    const leads = (data ?? []) as Lead[]

    return (
        <div className="mx-auto max-w-6xl px-6 py-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Formulaire d’inscription</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Demandes des marchands</h1>
            <p className="mt-1 text-sm text-zinc-500">Les demandes envoyées depuis la page d’inscription, de la plus récente à la plus ancienne.</p>

            {error ? (
                <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    Lecture impossible : {error.message}. Si la table n’existe pas encore, exécutez <code>supabase/create_merchant_leads.sql</code> dans Supabase.
                </p>
            ) : leads.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-500 dark:border-zinc-800">
                    Aucune demande pour le moment.
                </p>
            ) : (
                <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-zinc-100 text-xs uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
                            <tr>
                                <th className="px-5 py-3 font-bold">Date</th>
                                <th className="px-5 py-3 font-bold">Contact</th>
                                <th className="px-5 py-3 font-bold">Merchant Center</th>
                                <th className="px-5 py-3 font-bold">Site</th>
                                <th className="px-5 py-3 font-bold">Budget Shopping</th>
                                <th className="px-5 py-3 font-bold">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 align-top dark:divide-zinc-800">
                            {leads.map((lead) => (
                                <tr key={lead.id}>
                                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-zinc-500">
                                        {new Date(lead.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' })}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="font-semibold text-zinc-900 dark:text-white">{lead.name}</div>
                                        <a href={`mailto:${lead.email}`} className="text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">{lead.email}</a>
                                    </td>
                                    <td className="px-5 py-3 font-mono text-zinc-900 dark:text-white">{lead.gmc_id}</td>
                                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{lead.website ?? '—'}</td>
                                    <td className="whitespace-nowrap px-5 py-3 text-zinc-600 dark:text-zinc-400">{lead.monthly_budget ? BUDGET_LABELS[lead.monthly_budget] ?? lead.monthly_budget : '—'}</td>
                                    <td className="max-w-xs px-5 py-3 text-zinc-600 dark:text-zinc-400">{lead.message ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
