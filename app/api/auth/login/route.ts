import { NextResponse } from 'next/server'

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
        return NextResponse.json(
            { error: 'OAuth not configured' },
            { status: 500 }
        )
    }

    const scopes = [
        'https://www.googleapis.com/auth/content',       // Merchant Center access
        'https://www.googleapis.com/auth/userinfo.email', // Get user email
    ].join(' ')

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        access_type: 'offline',   // Get refresh_token
        prompt: 'consent',        // Force consent to always get refresh_token
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

    return NextResponse.redirect(authUrl)
}
