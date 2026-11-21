import { isInternalAuthorization, requireAdmin } from '@/lib/admin/auth'
import { runAccountSync } from '@/lib/gmc/runAccountSync'

// Synchro des comptes Merchant Center surveillés.
// Admin (bouton « Synchroniser ») ou planificateur (secret interne).
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
    const denied = requireAdmin(request, { allowInternal: true })
    if (denied) return denied

    const trigger = isInternalAuthorization(request.headers.get('authorization')) ? 'schedule' : 'manual'
    let result
    try {
        result = await runAccountSync(trigger)
    } catch (error) {
        // E.g. the sync log table does not exist yet (SQL script not run).
        return Response.json({ status: 'error', error: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
    if (result.status === 'busy') {
        return Response.json({ status: 'busy', error: 'Une synchro est déjà en cours.' }, { status: 409 })
    }
    return Response.json(result, { status: result.status === 'error' ? 500 : 200 })
}
