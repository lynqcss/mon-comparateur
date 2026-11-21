import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { google } from 'googleapis'

// ============================================================================
// Google service accounts used to read the clients' Merchant Center accounts.
//
// A service account manages at most 100 merchant accounts, so the tools work
// with a list. Keys live in secret settings (Vercel), never in the code:
//   - GOOGLE_SERVICE_ACCOUNT_JSON           the main Lynq key (local fallback:
//                                           config/service-account.json)
//   - GOOGLE_EXTRA_SERVICE_ACCOUNTS_JSON    optional, JSON array of extra keys
// ============================================================================

const SCOPE = 'https://www.googleapis.com/auth/content'

type ServiceAccountKey = { client_email?: string; private_key?: string } & Record<string, unknown>

export type ServiceAccount = {
    email: string
    getAccessToken: () => Promise<string>
}

function parseKeys(raw: string, source: string): ServiceAccountKey[] {
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        throw new Error(`${source} n'est pas un JSON valide`)
    }
    const keys = (Array.isArray(parsed) ? parsed : [parsed]) as ServiceAccountKey[]
    for (const key of keys) {
        if (!key?.client_email || !key?.private_key) throw new Error(`${source} contient une clé incomplète`)
    }
    return keys
}

function loadKeys(): ServiceAccountKey[] {
    const keys: ServiceAccountKey[] = []
    const main = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (main) {
        keys.push(...parseKeys(main, 'GOOGLE_SERVICE_ACCOUNT_JSON'))
    } else {
        const file = path.join(process.cwd(), 'config', 'service-account.json')
        if (existsSync(file)) keys.push(...parseKeys(readFileSync(file, 'utf8'), 'config/service-account.json'))
    }
    const extra = process.env.GOOGLE_EXTRA_SERVICE_ACCOUNTS_JSON
    if (extra) keys.push(...parseKeys(extra, 'GOOGLE_EXTRA_SERVICE_ACCOUNTS_JSON'))

    const seen = new Set<string>()
    return keys.filter((key) => !seen.has(key.client_email!) && seen.add(key.client_email!))
}

// Auth clients cached per service account (reused between warm invocations;
// each one caches its own access token until it expires).
const authCache = new Map<string, InstanceType<typeof google.auth.GoogleAuth>>()

/** Configured service accounts, in settings order. */
export function listServiceAccounts(): ServiceAccount[] {
    return loadKeys().map((key) => {
        const email = key.client_email!
        return {
            email,
            getAccessToken: async () => {
                let auth = authCache.get(email)
                if (!auth) {
                    auth = new google.auth.GoogleAuth({ credentials: key, scopes: [SCOPE] })
                    authCache.set(email, auth)
                }
                const client = await auth.getClient()
                const { token } = await client.getAccessToken()
                if (!token) throw new Error(`Impossible d'obtenir un jeton Google pour ${email}`)
                return token
            },
        }
    })
}
