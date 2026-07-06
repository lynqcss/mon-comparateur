import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getValidAccessToken, fetchMerchantAccounts } from '@/lib/tokenRefresh'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 })
    }

    const sessionId = authHeader.replace('Bearer ', '').trim()

    const { data: session, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 })
    }

    const tokenResult = await getValidAccessToken(session)
    if ('error' in tokenResult) {
        return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status })
    }

    try {
        const merchantResult = await fetchMerchantAccounts(tokenResult.accessToken)
        if ('error' in merchantResult) {
            return NextResponse.json({ error: merchantResult.error, details: merchantResult.details }, { status: 500 })
        }

        return NextResponse.json({
            email: session.google_email,
            accounts: merchantResult.accounts,
        })
    } catch (err: any) {
        console.error('Error fetching merchants:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
