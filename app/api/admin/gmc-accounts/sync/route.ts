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
    const result = await runAccountSync(trigger)
    if (result.status === 'busy') {
        return Response.json({ status: 'busy', error: 'Une synchro est déjà en cours.' }, { status: 409 })
    }
    return Response.json(result, { status: result.status === 'error' ? 500 : 200 })
}
