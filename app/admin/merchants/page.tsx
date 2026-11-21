import { Suspense } from 'react'
import MerchantsManager from './MerchantsManager'
import CatalogStats, { CatalogStatsSkeleton } from './CatalogStats'

// Chiffres privés du catalogue : jamais mis en cache.
export const dynamic = 'force-dynamic'

export default function MerchantsPage() {
    return (
        <>
            <MerchantsManager />
            <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8">
                <Suspense fallback={<CatalogStatsSkeleton />}>
                    <CatalogStats />
                </Suspense>
            </div>
        </>
    )
}
