import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 })
    }

    const sessionId = authHeader.replace('Bearer ', '').trim()

    // Retrieve the session with tokens
    const { data: session, error: sessionError } = await supabase
        .from('onboarding_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 })
    }

    let accessToken = session.access_token

    // Check if token is expired, refresh if needed
    if (new Date(session.token_expires_at) < new Date()) {
        if (!session.refresh_token) {
            return NextResponse.json({ error: 'Google OAuth token expired and no refresh token available' }, { status: 401 })
        }

        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: session.refresh_token,
                grant_type: 'refresh_token',
            }),
        })

        const refreshData = await refreshResponse.json()
        if (!refreshResponse.ok) {
            return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 })
        }

        accessToken = refreshData.access_token
        const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString()

        await supabase
            .from('onboarding_sessions')
            .update({ access_token: accessToken, token_expires_at: newExpiry })
            .eq('id', sessionId)
    }

    // Call the Merchant Center API to list the user's accounts
    try {
        const accountsResponse = await fetch(
            'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo',
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )

        const accountsData = await accountsResponse.json()

        if (!accountsResponse.ok) {
            console.error('Merchant API error:', accountsData)
            return NextResponse.json({ error: 'Failed to fetch merchant accounts', details: accountsData }, { status: 500 })
        }

        // Extract the list of Merchant Center accounts the user has access to
        const accounts = (accountsData.accountIdentifiers || []).map((acc: any) => ({
            merchantId: acc.merchantId || acc.aggregatorId,
            aggregatorId: acc.aggregatorId || null,
        }))

        return NextResponse.json({
            email: session.google_email,
            accounts,
        })
    } catch (err: any) {
        console.error('Error fetching merchants:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
