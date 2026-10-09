import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { GET as syncMerchant } from '@/app/api/gmc/sync/route'

// Synchronisation quotidienne de tous les marchands actifs (Vercel Cron,
// cf. vercel.json).
export const maxDuration = 300

// Temps total alloué à la tâche, avec une marge sous maxDuration.
const TIME_BUDGET_MS = 240_000

type SyncResult = {
    merchant_id: number
    name: string
    success: boolean
    done?: boolean
    batches?: number
    products?: number | null
    error?: string
}

export async function GET(req: Request) {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()

    // Marchands à synchroniser : non pausés ET réellement rattachés à un compte
    // Merchant Center. Le filtre sur `gmc_id` est un garde-fou : sans lui, les
    // marchands de démo (sans gmc_id) déclenchaient une invocation serverless
    // chacun, vouée à l'échec — 98 appels inutiles par jour.
    const { data: merchants, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('sync_paused', false)
        .not('gmc_id', 'is', null)

    if (error || !merchants) {
        return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 })
    }

    const results: SyncResult[] = []

    for (const merchant of merchants) {
        const result: SyncResult = { merchant_id: merchant.id, name: merchant.name, success: false, batches: 0 }
        try {
            // La synchro est appelée DIRECTEMENT, dans le même processus, et non
            // par une requête HTTP vers ce site. Vercel lance le cron sur l'URL
            // du déploiement, protégée par « Vercel Authentication » : la requête
            // interne y recevait une page de connexion au lieu de la synchro, et
            // le cron répondait 200 sans avoir rien synchronisé.
            //
            // `chain=0` désactive l'auto-enchaînement HTTP de la synchro, pour la
            // même raison : c'est cette boucle qui enchaîne les lots.
            const url = new URL('/api/gmc/sync', req.url)
            url.searchParams.set('merchantId', String(merchant.id))
            url.searchParams.set('chain', '0')

            let done = false
            while (!done) {
                if (Date.now() - startTime > TIME_BUDGET_MS) {
                    // Le curseur est sauvegardé : le cycle reprendra demain.
                    result.error = 'Temps alloué dépassé : la synchronisation reprendra au prochain passage.'
                    break
                }
                const res = await syncMerchant(new NextRequest(url))
                const data = await res.json()
                result.batches = (result.batches ?? 0) + 1
                if (!data.success) {
                    result.error = data.error || data.message || `HTTP ${res.status}`
                    break
                }
                result.products = data.total_products ?? data.products_this_call ?? null
                done = data.done !== false
            }
            result.done = done
            result.success = done
        } catch (err: unknown) {
            result.error = err instanceof Error ? err.message : String(err)
        }
        results.push(result)
    }

    const failed = results.filter((r) => !r.success).length

    // Un échec doit se voir dans les journaux Vercel : plus de 200 trompeur.
    return NextResponse.json(
        { synced: results.length - failed, failed, results },
        { status: failed > 0 ? 500 : 200 }
    )
}
