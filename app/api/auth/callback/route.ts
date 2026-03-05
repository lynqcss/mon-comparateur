import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(new URL('/onboarding?error=consent_denied', req.url))
    }

    if (!code) {
        return NextResponse.redirect(new URL('/onboarding?error=no_code', req.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!

    try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok) {
            console.error('Token exchange error:', tokenData)
            return NextResponse.redirect(new URL('/onboarding?error=token_exchange', req.url))
        }

        const { access_token, refresh_token, expires_in } = tokenData

        // Get the user's email from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
        })
        const userInfo = await userInfoResponse.json()
        const googleEmail = userInfo.email || 'unknown'

        // Store the session in Supabase
        const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

        const { data: session, error: insertError } = await supabase
            .from('onboarding_sessions')
            .insert({
                google_email: googleEmail,
                access_token,
                refresh_token: refresh_token || null,
                token_expires_at: expiresAt,
                switch_status: 'pending',
            })
            .select('id')
            .single()

        if (insertError || !session) {
            console.error('Error saving session:', insertError)
            return NextResponse.redirect(new URL('/onboarding?error=db_error', req.url))
        }

        // Redirect to onboarding page with session ID
        return NextResponse.redirect(
            new URL(`/onboarding?step=merchants&session=${session.id}`, req.url)
        )
    } catch (err) {
        console.error('OAuth callback error:', err)
        return NextResponse.redirect(new URL('/onboarding?error=unknown', req.url))
    }
}
