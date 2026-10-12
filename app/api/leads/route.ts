import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Formulaire simplifié de /onboarding : route publique, écriture seule.
const BUDGETS = ['lt1k', '1k-10k', '10k-50k', 'gt50k']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

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
    return NextResponse.json({ ok: true })
}
