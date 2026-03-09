import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import path from 'path'
import { google } from 'googleapis'

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

        const keyFile = path.join(process.cwd(), 'config', 'service-account.json')
        const auth = new google.auth.GoogleAuth({
            keyFile,
            scopes: ['https://www.googleapis.com/auth/content'],
        })
        const authClient = await auth.getClient()
        const tokenResponse = await authClient.getAccessToken()
        const accessToken = tokenResponse.token

        const results = []

        for (const merchantId of merchantIds) {
            try {
                const switchResponse = await fetch(
                    `https://shoppingcontent.googleapis.com/content/v2.1/${cssDomainId}/csses/${cssDomainId}/updatelabels`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ merchantId }),
                    }
                )

                const switchData = await switchResponse.json()
                results.push({ merchantId, status: 'requested', data: switchData })
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
