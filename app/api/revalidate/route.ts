import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

// Vide le cache du catalogue (facettes de /products, liste de /merchants).
// Appelée par l'import Awin (GitHub Actions) une fois les offres écrites :
// sans elle, un nouveau marchand pouvait rester absent de l'annuaire.
export async function POST(req: Request) {
    const secret = process.env.CRON_SECRET
    if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Expiration immédiate : la visite suivante recalcule, au lieu de servir
    // l'ancienne version en attendant un rafraîchissement en arrière-plan.
    revalidateTag('catalog', { expire: 0 })
    return NextResponse.json({ ok: true })
}
