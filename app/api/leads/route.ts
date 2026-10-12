import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Formulaire simplifié de /onboarding : route publique, écriture seule.
const BUDGETS = ['lt1k', '1k-10k', '10k-50k', 'gt50k']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const BUDGET_LABELS: Record<string, string> = {
    lt1k: 'Moins de 1 000 € par mois',
    '1k-10k': '1 000 à 10 000 € par mois',
    '10k-50k': '10 000 à 50 000 € par mois',
    gt50k: 'Plus de 50 000 € par mois',
}

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

type Lead = { name: string; email: string; website: string; gmcId: string; budget: string; message: string }

/**
 * Prévient par e-mail qu'un marchand vient de s'inscrire (service Resend).
 * Sans clé `RESEND_API_KEY`, ou si l'envoi échoue, l'inscription reste
 * enregistrée : la notification ne doit jamais faire échouer le formulaire.
 */
async function notify(lead: Lead) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return

    const lines = [
        `Nom : ${lead.name}`,
        `E-mail : ${lead.email}`,
        `Identifiant Merchant Center : ${lead.gmcId}`,
        `Site : ${lead.website || 'non renseigné'}`,
        `Budget Google Shopping : ${BUDGET_LABELS[lead.budget] ?? 'non renseigné'}`,
        `Message : ${lead.message || 'aucun'}`,
        '',
        'Toutes les inscriptions : https://lynq-css.com/admin/leads',
    ]

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: process.env.LEAD_NOTIFY_FROM || 'Lynq <onboarding@resend.dev>',
                to: [process.env.LEAD_NOTIFY_EMAIL || 'contact@lynq-css.com'],
                reply_to: lead.email,
                subject: `Nouvelle inscription Lynq : ${lead.name}`,
                text: lines.join('\n'),
            }),
            signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) console.error('Lead notification refused:', response.status, await response.text())
    } catch (error) {
        console.error('Lead notification error:', error)
    }
}

export async function POST(req: NextRequest) {
    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
    }

    // Champ piège invisible : un humain le laisse vide, un robot le remplit.
    // On répond « ok » sans rien enregistrer pour ne pas l'aider à s'adapter.
    if (clean(body.company, 200)) return NextResponse.json({ ok: true })

    const name = clean(body.name, 120)
    const email = clean(body.email, 200)
    const website = clean(body.website, 200)
    const gmcId = clean(body.gmcId, 20).replace(/[\s-]/g, '')
    const budget = clean(body.budget, 20)
    const message = clean(body.message, 2000)

    if (!name) return NextResponse.json({ error: 'Indiquez votre nom.' }, { status: 400 })
    if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })
    if (!/^\d{5,15}$/.test(gmcId)) {
        return NextResponse.json({ error: 'L’identifiant Merchant Center ne contient que des chiffres.' }, { status: 400 })
    }

    const { error } = await supabase.from('merchant_leads').insert({
        name,
        email,
        website: website || null,
        gmc_id: gmcId,
        monthly_budget: BUDGETS.includes(budget) ? budget : null,
        message: message || null,
    })

    if (error) {
        console.error('Lead insert error:', error.message)
        return NextResponse.json({ error: 'Enregistrement impossible pour le moment.' }, { status: 500 })
    }

    await notify({ name, email, website, gmcId, budget, message })
    return NextResponse.json({ ok: true })
}
