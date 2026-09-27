import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { proposeComparisonShoppingService } from '@/lib/googleClient'

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 })
    }

    const sessionId = authHeader.replace('Bearer ', '').trim()

    try {
        const body = await req.json()
        const { merchantIds } = body

        if (!merchantIds || !Array.isArray(merchantIds) || merchantIds.length === 0) {
            return NextResponse.json(
                { error: 'merchantIds[] is required' },
                { status: 400 }
            )
        }

        // Retrieve the session
        const { data: session, error: sessionError } = await supabase
            .from('onboarding_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (sessionError || !session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const cssDomainId = process.env.LYNQ_CSS_DOMAIN_ID

        if (!cssDomainId || cssDomainId === 'TODO') {
            await supabase
                .from('onboarding_sessions')
                .update({
                    selected_merchant_ids: merchantIds,
                    switch_status: 'pending_css_setup',
                })
                .eq('id', sessionId)

            return NextResponse.json({
                success: true,
                message: 'Votre demande a été enregistrée ! Notre équipe vous contactera pour finaliser l\'activation de Lynq CSS sur vos marchands.',
                status: 'pending_css_setup',
            })
        }

        // Rattachement CSS via la Merchant API : Lynq propose son service de
        // comparison shopping au compte du marchand, qui doit ensuite
        // l'approuver (d'ou l'etat renvoye dans `handshake`).
        const results = []

        for (const merchantId of merchantIds) {
            try {
                const service = await proposeComparisonShoppingService({
                    merchantAccountId: merchantId,
                    cssAccountId: cssDomainId,
                })

                results.push({
                    merchantId,
                    status: 'requested',
                    approvalState: service.handshake?.approvalState ?? null,
                    data: service,
                })
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err)
                console.error(`CSS switch error for merchant ${merchantId}:`, message)
                results.push({ merchantId, status: 'error', error: message })
            }
        }

        await supabase
            .from('onboarding_sessions')
            .update({
                selected_merchant_ids: merchantIds,
                switch_status: 'requested',
            })
            .eq('id', sessionId)

        return NextResponse.json({
            success: true,
            message: 'Demandes de switch CSS envoyées avec succès !',
            results,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('Switch CSS error:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
