import { requireAdmin } from '@/lib/admin/auth'
import { MANUAL_EXCLUSION, MCA_EXCLUSION } from '@/lib/gmc/accountSync'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

/**
 * Exclusion manuelle d'un compte surveillé (marketplace…) ou réintégration.
 * Body : { excluded: boolean }. Un MCA reste exclu d'office.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ accountId: string }> }) {
    const denied = requireAdmin(request)
    if (denied) return denied

    const { accountId } = await params
    if (!/^\d{1,20}$/.test(accountId)) return Response.json({ error: 'Identifiant invalide' }, { status: 400 })

    const body = await request.json().catch(() => null)
    if (typeof body?.excluded !== 'boolean') return Response.json({ error: 'Champ « excluded » attendu' }, { status: 400 })

    const { data: account, error: readError } = await supabase
        .from('gmc_accounts')
        .select('account_id, excluded_reason')
        .eq('account_id', accountId)
        .maybeSingle()
    if (readError) return Response.json({ error: readError.message }, { status: 500 })
    if (!account) return Response.json({ error: 'Compte introuvable' }, { status: 404 })
    if (account.excluded_reason === MCA_EXCLUSION) {
        return Response.json({ error: 'Un MCA reste exclu : il ne contient pas de produits.' }, { status: 409 })
    }

    const { error } = await supabase
        .from('gmc_accounts')
        .update({
            excluded: body.excluded,
            excluded_reason: body.excluded ? MANUAL_EXCLUSION : null,
            updated_at: new Date().toISOString(),
        })
        .eq('account_id', accountId)
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({ ok: true })
}
