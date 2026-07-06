import { supabase } from '@/lib/supabaseClient'

type SessionWithTokens = {
  id: string
  access_token: string
  refresh_token: string | null
  token_expires_at: string
  google_email: string | null
  [key: string]: unknown
}

/**
 * Checks if the session's access token is expired and refreshes it if needed.
 * Returns the valid access token, or null with an error message if refresh fails.
 */
export async function getValidAccessToken(
  session: SessionWithTokens
): Promise<{ accessToken: string } | { error: string; status: number }> {
  let accessToken = session.access_token

  if (new Date(session.token_expires_at) < new Date()) {
    if (!session.refresh_token) {
      return { error: 'Google OAuth token expired and no refresh token available', status: 401 }
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
      return { error: 'Token refresh failed', status: 401 }
    }

    accessToken = refreshData.access_token
    const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString()

    await supabase
      .from('onboarding_sessions')
      .update({ access_token: accessToken, token_expires_at: newExpiry })
      .eq('id', session.id)
  }

  return { accessToken }
}

/**
 * Fetches merchant accounts from Google Merchant Center API using the given access token.
 */
export async function fetchMerchantAccounts(accessToken: string) {
  const accountsResponse = await fetch(
    'https://shoppingcontent.googleapis.com/content/v2.1/accounts/authinfo',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  const accountsData = await accountsResponse.json()

  if (!accountsResponse.ok) {
    console.error('Merchant API error:', accountsData)
    return { error: 'Failed to fetch merchant accounts', details: accountsData }
  }

  const accounts = (accountsData.accountIdentifiers || []).map((acc: any) => ({
    merchantId: acc.merchantId || acc.aggregatorId,
    aggregatorId: acc.aggregatorId || null,
  }))

  return { accounts }
}
