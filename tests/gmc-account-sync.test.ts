import { describe, expect, it } from 'vitest'
import { planAccountSync, type AccountListing, type AccountSignals, type StoredAccount } from '@/lib/gmc/accountSync'
import { parseServices } from '@/lib/gmc/merchantAccounts'

const SA1 = 'sa-1@project.iam.gserviceaccount.com'
const SA2 = 'sa-2@project.iam.gserviceaccount.com'

const listed = (accountId: string, name = `Shop ${accountId}`) => ({ accountId, name, website: null, languageCode: 'fr-FR' })
const ok = (serviceAccount: string, ids: string[]): AccountListing => ({ serviceAccount, ok: true, accounts: ids.map((id) => listed(id)) })
const stored = (accountId: string, over: Partial<StoredAccount> = {}): StoredAccount => ({
    account_id: accountId,
    name: `Shop ${accountId}`,
    website: null,
    language_code: 'fr-FR',
    account_type: 'standalone',
    aggregator_id: null,
    css_provider_id: null,
    css_provider_name: null,
    ads_customer_ids: [],
    service_account: SA1,
    active: true,
    excluded: false,
    excluded_reason: null,
    ...over,
})
const standalone: AccountSignals = { accountType: 'standalone', aggregatorId: null, cssProviderId: null, cssProviderName: null, adsCustomerIds: [] }
const signalsFor = (ids: string[], s: AccountSignals = standalone) => new Map(ids.map((id) => [id, s]))

function plan(previous: StoredAccount[], listings: AccountListing[], signals = new Map<string, AccountSignals>()) {
    const result = planAccountSync({ previous, listings, signals })
    if (result.abort) throw new Error(`unexpected abort: ${result.reason}`)
    return result
}

describe('planAccountSync', () => {
    it('makes the union of every service account and remembers who sees each account', () => {
        const result = plan([], [ok(SA1, ['1', '2']), ok(SA2, ['2', '3'])], signalsFor(['1', '2', '3']))
        expect(result.upserts.map((r) => [r.account_id, r.service_account])).toEqual([
            ['1', SA1],
            ['2', SA1],
            ['3', SA2],
        ])
        expect(result.changes.added).toEqual(['1', '2', '3'])
        expect(result.deactivate).toEqual([])
    })

    it('stops before writing anything when one listing failed', () => {
        const result = planAccountSync({
            previous: [stored('1'), stored('2')],
            listings: [ok(SA1, ['1']), { serviceAccount: SA2, ok: false, error: 'HTTP 403' }],
            signals: new Map(),
        })
        expect(result.abort).toBe(true)
        if (result.abort) expect(result.reason).toContain(SA2)
    })

    it('stops when no service account is configured', () => {
        expect(planAccountSync({ previous: [], listings: [], signals: new Map() }).abort).toBe(true)
    })

    it('refuses to deactivate everything when Google suddenly returns no account', () => {
        const result = planAccountSync({ previous: [stored('1'), stored('2')], listings: [ok(SA1, [])], signals: new Map() })
        expect(result.abort).toBe(true)
    })

    it('deactivates (never deletes) an account that is no longer visible', () => {
        const result = plan([stored('1'), stored('2')], [ok(SA1, ['1'])], signalsFor(['1']))
        expect(result.deactivate).toEqual(['2'])
        expect(result.changes.deactivated).toEqual(['2'])
        expect(result.upserts.map((r) => r.account_id)).toEqual(['1'])
    })

    it('does not deactivate an account twice', () => {
        const result = plan([stored('1'), stored('2', { active: false })], [ok(SA1, ['1'])], signalsFor(['1']))
        expect(result.deactivate).toEqual([])
    })

    it('reactivates an account that reappears', () => {
        const result = plan([stored('1', { active: false })], [ok(SA1, ['1'])], signalsFor(['1']))
        expect(result.changes.reactivated).toEqual(['1'])
        expect(result.upserts[0].active).toBe(true)
    })

    it('excludes an MCA automatically, and lifts that exclusion if it is no longer an MCA', () => {
        const mca = plan([], [ok(SA1, ['9'])], signalsFor(['9'], { ...standalone, accountType: 'mca' }))
        expect(mca.upserts[0]).toMatchObject({ excluded: true, excluded_reason: 'mca' })
        expect(mca.changes.excluded).toEqual(['9'])

        const notMcaAnymore = plan([stored('9', { account_type: 'mca', excluded: true, excluded_reason: 'mca' })], [ok(SA1, ['9'])], signalsFor(['9']))
        expect(notMcaAnymore.upserts[0]).toMatchObject({ excluded: false, excluded_reason: null })
    })

    it('keeps a manual exclusion (marketplace…)', () => {
        const result = plan([stored('5', { excluded: true, excluded_reason: 'marketplace' })], [ok(SA1, ['5'])], signalsFor(['5']))
        expect(result.upserts[0]).toMatchObject({ excluded: true, excluded_reason: 'marketplace' })
    })

    it('keeps the previous values when a detail call failed', () => {
        const previous = stored('1', { account_type: 'subaccount', aggregator_id: '77', css_provider_id: '140802286', ads_customer_ids: ['1112223333'] })
        const result = plan([previous], [ok(SA1, ['1'])], new Map([['1', {}]]))
        expect(result.upserts[0]).toMatchObject({ account_type: 'subaccount', aggregator_id: '77', css_provider_id: '140802286', ads_customer_ids: ['1112223333'] })
        expect(result.changes.updated).toEqual([])
    })

    it('reports which fields changed', () => {
        const result = plan([stored('1')], [{ serviceAccount: SA1, ok: true, accounts: [listed('1', 'New name')] }], signalsFor(['1'], { ...standalone, cssProviderId: '2000000001' }))
        expect(result.changes.updated).toEqual([{ accountId: '1', fields: ['name', 'css_provider_id'] }])
    })

    it('keeps the same service account while it still sees the account', () => {
        const result = plan([stored('2', { service_account: SA2 })], [ok(SA1, ['2']), ok(SA2, ['2'])], signalsFor(['2']))
        expect(result.upserts[0].service_account).toBe(SA2)
    })
})

describe('parseServices (real Google answer shapes)', () => {
    it('reads the CSS in use, the linked Google Ads account and no aggregator', () => {
        const parsed = parseServices([
            { provider: 'providers/GOOGLE_ADS', providerDisplayName: 'Google Ads', handshake: { approvalState: 'ESTABLISHED' }, externalAccountId: '1112223333', campaignsManagement: {} },
            { provider: 'providers/140802286', providerDisplayName: 'Google Shopping (google.com/shopping)', handshake: { approvalState: 'ESTABLISHED' }, externalAccountId: '100000001', comparisonShopping: {} },
        ])
        expect(parsed).toEqual({ cssProviderId: '140802286', cssProviderName: 'Google Shopping (google.com/shopping)', adsCustomerIds: ['1112223333'], aggregatorId: null })
    })

    it('detects the parent MCA of a sub-account and ignores pending proposals', () => {
        const parsed = parseServices([
            { provider: 'providers/123', handshake: { approvalState: 'ESTABLISHED' }, accountAggregation: {} },
            { provider: 'providers/2000000001', providerDisplayName: 'Lynq', handshake: { approvalState: 'PENDING' }, comparisonShopping: {} },
        ])
        expect(parsed.aggregatorId).toBe('123')
        expect(parsed.cssProviderId).toBeNull()
    })
})
