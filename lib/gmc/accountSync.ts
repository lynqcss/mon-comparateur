// ============================================================================
// Monitored Merchant Center accounts: sync calculation.
//
// Pure module (no network, no database) so that every rule is tested:
//   - the perimeter is the UNION of the accounts listed by each service account;
//   - if a listing call failed, nothing is written (we stop before
//     deactivating anything);
//   - mirror deactivation: an account no longer visible becomes inactive,
//     it is never deleted, and it is reactivated if it reappears;
//   - an MCA (container without products) is excluded automatically;
//   - when a detail call failed, the previous values are kept.
// ============================================================================

export type AccountType = 'standalone' | 'subaccount' | 'mca' | 'unknown'

export type ListedAccount = {
    accountId: string
    name: string | null
    website: string | null
    languageCode: string | null
}

export type AccountListing =
    | { serviceAccount: string; ok: true; accounts: ListedAccount[] }
    | { serviceAccount: string; ok: false; error: string }

/** Detail signals of an account. `undefined` = unknown (call failed): keep the previous value. */
export type AccountSignals = {
    accountType?: AccountType
    aggregatorId?: string | null
    cssProviderId?: string | null
    cssProviderName?: string | null
    adsCustomerIds?: string[]
}

/** Columns of `gmc_accounts` written by the sync. */
export type AccountRow = {
    account_id: string
    name: string | null
    website: string | null
    language_code: string | null
    account_type: AccountType
    aggregator_id: string | null
    css_provider_id: string | null
    css_provider_name: string | null
    ads_customer_ids: string[]
    service_account: string
    active: boolean
    excluded: boolean
    excluded_reason: string | null
}

export type StoredAccount = Omit<AccountRow, 'service_account'> & { service_account: string | null }

export type SyncChanges = {
    added: string[]
    reactivated: string[]
    deactivated: string[]
    excluded: string[]
    updated: { accountId: string; fields: string[] }[]
}

export type SyncPlan =
    | { abort: true; reason: string }
    | { abort: false; upserts: AccountRow[]; deactivate: string[]; changes: SyncChanges }

export const MCA_EXCLUSION = 'mca'
/** Exclusion set by hand from the admin (marketplace…), kept by every sync. */
export const MANUAL_EXCLUSION = 'manual'

/** Fields compared to report what changed for an existing account. */
const TRACKED_FIELDS = [
    'name',
    'website',
    'account_type',
    'aggregator_id',
    'css_provider_id',
    'ads_customer_ids',
    'service_account',
    'excluded',
] as const satisfies readonly (keyof AccountRow)[]

function same(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')
    return (a ?? null) === (b ?? null)
}

export function planAccountSync(input: {
    previous: StoredAccount[]
    listings: AccountListing[]
    signals: Map<string, AccountSignals>
}): SyncPlan {
    const { previous, listings, signals } = input

    if (listings.length === 0) return { abort: true, reason: 'Aucun compte de service configuré.' }

    const failed = listings.filter((l): l is Extract<AccountListing, { ok: false }> => !l.ok)
    if (failed.length > 0) {
        return {
            abort: true,
            reason: `Liste des comptes impossible pour ${failed.map((f) => `${f.serviceAccount} (${f.error})`).join(', ')}. Rien n'a été modifié.`,
        }
    }

    // Union of the listings; remember which service accounts see each account.
    const visible = new Map<string, { account: ListedAccount; seenBy: string[] }>()
    for (const listing of listings) {
        if (!listing.ok) continue
        for (const account of listing.accounts) {
            const entry = visible.get(account.accountId)
            if (entry) entry.seenBy.push(listing.serviceAccount)
            else visible.set(account.accountId, { account, seenBy: [listing.serviceAccount] })
        }
    }

    const previousById = new Map(previous.map((p) => [p.account_id, p]))
    const activeBefore = previous.filter((p) => p.active).length

    // Safety net: an empty answer while accounts were monitored looks like a
    // Google-side glitch, not like every client leaving at once.
    if (visible.size === 0 && activeBefore > 0) {
        return {
            abort: true,
            reason: `Google ne renvoie aucun compte alors que ${activeBefore} étaient surveillés. Rien n'a été désactivé par précaution.`,
        }
    }

    const changes: SyncChanges = { added: [], reactivated: [], deactivated: [], excluded: [], updated: [] }
    const upserts: AccountRow[] = []

    for (const [accountId, { account, seenBy }] of visible) {
        const prev = previousById.get(accountId)
        const s = signals.get(accountId) ?? {}

        const accountType = s.accountType ?? prev?.account_type ?? 'unknown'
        const isMca = accountType === 'mca'
        const manuallyExcluded = prev?.excluded === true && prev.excluded_reason !== MCA_EXCLUSION

        const row: AccountRow = {
            account_id: accountId,
            name: account.name ?? prev?.name ?? null,
            website: account.website ?? prev?.website ?? null,
            language_code: account.languageCode ?? prev?.language_code ?? null,
            account_type: accountType,
            aggregator_id: s.aggregatorId !== undefined ? s.aggregatorId : (prev?.aggregator_id ?? null),
            css_provider_id: s.cssProviderId !== undefined ? s.cssProviderId : (prev?.css_provider_id ?? null),
            css_provider_name: s.cssProviderName !== undefined ? s.cssProviderName : (prev?.css_provider_name ?? null),
            ads_customer_ids: s.adsCustomerIds ?? prev?.ads_customer_ids ?? [],
            // Keep the same service account while it still sees the account.
            service_account: prev?.service_account && seenBy.includes(prev.service_account) ? prev.service_account : seenBy[0],
            active: true,
            excluded: isMca || manuallyExcluded,
            excluded_reason: isMca ? MCA_EXCLUSION : manuallyExcluded ? (prev?.excluded_reason ?? null) : null,
        }
        upserts.push(row)

        if (!prev) {
            changes.added.push(accountId)
        } else {
            if (!prev.active) changes.reactivated.push(accountId)
            const fields = TRACKED_FIELDS.filter((f) => !same(row[f], prev[f]))
            if (fields.length > 0) changes.updated.push({ accountId, fields })
        }
        if (isMca && !(prev?.excluded && prev.excluded_reason === MCA_EXCLUSION)) changes.excluded.push(accountId)
    }

    const deactivate = previous.filter((p) => p.active && !visible.has(p.account_id)).map((p) => p.account_id)
    changes.deactivated.push(...deactivate)

    return { abort: false, upserts, deactivate, changes }
}
