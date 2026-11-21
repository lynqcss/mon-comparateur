import { describe, expect, it } from 'vitest'
import { listServiceAccounts } from '@/lib/google/serviceAccounts'
import { fetchAccountSignals, listAccounts, type CallRecord } from '@/lib/gmc/merchantAccounts'
import { planAccountSync, type AccountSignals } from '@/lib/gmc/accountSync'

// Live check against Google with the real service account, GET calls only,
// nothing written. Run on demand:  npm run test:live
describe('monitored accounts sync against real Google answers', () => {
    it('lists, details and plans without error', async () => {
        const calls: CallRecord[] = []
        const serviceAccounts = listServiceAccounts()
        expect(serviceAccounts.length).toBeGreaterThan(0)

        const listings = []
        for (const sa of serviceAccounts) listings.push(await listAccounts(sa, calls))
        expect(listings.every((l) => l.ok)).toBe(true)

        const signals = new Map<string, AccountSignals>()
        for (const listing of listings) {
            if (!listing.ok) continue
            const sa = serviceAccounts.find((s) => s.email === listing.serviceAccount)!
            for (const a of listing.accounts) signals.set(a.accountId, await fetchAccountSignals(sa, a.accountId, calls))
        }

        const plan = planAccountSync({ previous: [], listings, signals })
        expect(plan.abort).toBe(false)
        if (plan.abort) return
        console.table(plan.upserts.map((r) => ({ id: r.account_id, name: r.name, type: r.account_type, css: r.css_provider_name, ads: r.ads_customer_ids.join(','), excluded: r.excluded })))
        console.table(calls)
        for (const row of plan.upserts) expect(row.account_type).not.toBe('unknown')
    }, 60_000)
})
