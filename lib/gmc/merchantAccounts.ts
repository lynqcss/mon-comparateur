import type { ServiceAccount } from '@/lib/google/serviceAccounts'
import type { AccountListing, AccountSignals, ListedAccount } from './accountSync'

// ============================================================================
// Merchant API v1 calls for the monitored accounts sync (GET only).
// Shapes checked against real Google answers on 21/11/2026:
//   - accounts.list            → { accounts: [{ accountId, accountName, homePageUri, languageCode }] }
//   - accounts:listSubaccounts → 200 on an MCA; 400 "IS_AGGREGATOR" otherwise
//   - accounts/{id}/services   → { accountServices: [{ provider, providerDisplayName,
//                                  handshake.approvalState, externalAccountId,
//                                  comparisonShopping | campaignsManagement | accountAggregation }] }
// Every call is recorded (service account, call, HTTP status) for the
// diagnostic screen.
// ============================================================================

const BASE = 'https://merchantapi.googleapis.com'
const PAGE_SIZE = 250
const MAX_PAGES = 100

export type CallRecord = {
    serviceAccount: string
    call: string
    httpStatus: number | null
    count?: number
    error?: string
}

type GoogleAnswer = { status: number | null; body: any }

async function getJson(token: string, url: string): Promise<GoogleAnswer> {
    try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const text = await res.text()
        let body: unknown = text
        try {
            body = JSON.parse(text)
        } catch {
            // Non-JSON answer: kept as text.
        }
        return { status: res.status, body }
    } catch (error) {
        return { status: null, body: { error: { message: error instanceof Error ? error.message : String(error) } } }
    }
}

/** Short, readable reason from a Google error answer. */
export function googleErrorMessage(answer: GoogleAnswer): string {
    const message = answer.body?.error?.message ?? (typeof answer.body === 'string' ? answer.body : '')
    const prefix = answer.status === null ? 'Réseau' : `HTTP ${answer.status}`
    return `${prefix}${message ? ` : ${String(message).slice(0, 240)}` : ''}`
}

const providerId = (provider: string | undefined) => (provider ?? '').replace(/^providers\//, '') || null

/** Every account the service account can read (all pages). */
export async function listAccounts(sa: ServiceAccount, log: CallRecord[]): Promise<AccountListing> {
    let token: string
    try {
        token = await sa.getAccessToken()
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log.push({ serviceAccount: sa.email, call: 'Jeton Google', httpStatus: null, error: message })
        return { serviceAccount: sa.email, ok: false, error: message }
    }

    const accounts: ListedAccount[] = []
    let pageToken: string | undefined
    for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL(`${BASE}/accounts/v1/accounts`)
        url.searchParams.set('pageSize', String(PAGE_SIZE))
        if (pageToken) url.searchParams.set('pageToken', pageToken)

        const answer = await getJson(token, url.toString())
        if (answer.status !== 200) {
            const error = googleErrorMessage(answer)
            log.push({ serviceAccount: sa.email, call: 'Liste des comptes', httpStatus: answer.status, error })
            return { serviceAccount: sa.email, ok: false, error }
        }
        for (const a of answer.body?.accounts ?? []) {
            if (!a?.accountId) continue
            accounts.push({
                accountId: String(a.accountId),
                name: a.accountName ?? null,
                website: a.homePageUri ?? null,
                languageCode: a.languageCode ?? null,
            })
        }
        pageToken = answer.body?.nextPageToken
        if (!pageToken) break
    }

    log.push({ serviceAccount: sa.email, call: 'Liste des comptes', httpStatus: 200, count: accounts.length })
    return { serviceAccount: sa.email, ok: true, accounts }
}

type AccountService = {
    provider?: string
    providerDisplayName?: string
    externalAccountId?: string
    handshake?: { approvalState?: string }
    comparisonShopping?: object
    campaignsManagement?: object
    accountAggregation?: object
}

/** Pure parsing of the `services` answer (exported for tests). */
export function parseServices(services: AccountService[]): Required<Pick<AccountSignals, 'cssProviderId' | 'cssProviderName' | 'adsCustomerIds'>> & {
    aggregatorId: string | null
} {
    const established = services.filter((s) => s.handshake?.approvalState === 'ESTABLISHED')
    const css = established.find((s) => s.comparisonShopping)
    const aggregator = established.find((s) => s.accountAggregation)
    const ads = established.filter((s) => s.campaignsManagement && s.externalAccountId).map((s) => String(s.externalAccountId))
    return {
        cssProviderId: providerId(css?.provider),
        cssProviderName: css?.providerDisplayName ?? null,
        adsCustomerIds: [...new Set(ads)],
        aggregatorId: providerId(aggregator?.provider),
    }
}

/**
 * Type, CSS in use and linked Google Ads accounts of one account (2 calls).
 * A failed call leaves the matching fields undefined (previous values kept).
 */
export async function fetchAccountSignals(sa: ServiceAccount, accountId: string, log: CallRecord[]): Promise<AccountSignals> {
    const token = await sa.getAccessToken()
    const [subaccounts, services] = await Promise.all([
        getJson(token, `${BASE}/accounts/v1/accounts/${accountId}:listSubaccounts?pageSize=1`),
        getJson(token, `${BASE}/accounts/v1/accounts/${accountId}/services?pageSize=100`),
    ])

    const signals: AccountSignals = {}

    const notAggregator = subaccounts.status === 400 && /IS_AGGREGATOR/.test(JSON.stringify(subaccounts.body))
    if (subaccounts.status !== 200 && !notAggregator) {
        log.push({ serviceAccount: sa.email, call: `Type du compte ${accountId}`, httpStatus: subaccounts.status, error: googleErrorMessage(subaccounts) })
    }
    if (services.status !== 200) {
        log.push({ serviceAccount: sa.email, call: `Services du compte ${accountId}`, httpStatus: services.status, error: googleErrorMessage(services) })
    } else {
        const parsed = parseServices(services.body?.accountServices ?? [])
        signals.cssProviderId = parsed.cssProviderId
        signals.cssProviderName = parsed.cssProviderName
        signals.adsCustomerIds = parsed.adsCustomerIds
        if (notAggregator) {
            signals.accountType = parsed.aggregatorId ? 'subaccount' : 'standalone'
            signals.aggregatorId = parsed.aggregatorId
        }
    }
    if (subaccounts.status === 200) {
        signals.accountType = 'mca'
        signals.aggregatorId = null
    }
    return signals
}
