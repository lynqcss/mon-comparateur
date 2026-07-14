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
 * Fetches the merchant accounts accessible to the authenticated user via the
 * Merchant API (accounts sub-API), replacing the deprecated Content API v2.1
 * `accounts/authinfo` endpoint (coupée par Google le 18 août 2026).
 *
 * NOTE : cette partie ne peut pas être testée en local sans une vraie session
 * OAuth marchand. À vérifier de bout-en-bout lors d'un onboarding réel.
 * Le format de retour ({ merchantId, aggregatorId }) est conservé à l'identique
 * pour ne pas casser app/onboarding/auto/page.tsx.
 */
export async function fetchMerchantAccounts(accessToken: string) {
  const accounts: { merchantId: string; aggregatorId: string | null }[] = []
  let pageToken: string | undefined
  let guard = 0

  do {
    const url = new URL('https://merchantapi.googleapis.com/accounts/v1/accounts')
    url.searchParams.set('pageSize', '250')
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const accountsResponse = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const accountsData = await accountsResponse.json()

    if (!accountsResponse.ok) {
      console.error('Merchant API accounts.list error:', accountsData)
      return { error: 'Failed to fetch merchant accounts', details: accountsData }
    }

    for (const acc of accountsData.accounts || []) {
      // acc.name = "accounts/{id}" ; acc.accountId = id numérique.
      const merchantId =
        acc.accountId || (typeof acc.name === 'string' ? acc.name.split('/')[1] : null)
      if (merchantId) {
        accounts.push({ merchantId: String(merchantId), aggregatorId: null })
      }
    }

    pageToken = accountsData.nextPageToken
    guard += 1
  } while (pageToken && guard < 20)

  return { accounts }
}
