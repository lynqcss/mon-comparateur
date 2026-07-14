import { NextRequest, NextResponse } from 'next/server'

// Vérifie les identifiants admin (Basic Auth) — utilisé par l'UI /admin et,
// via le cache de credentials du navigateur, par ses appels fetch aux /api.
function hasValidBasicAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return false

    const [scheme, encoded] = authHeader.split(' ')
    if (scheme !== 'Basic' || !encoded) return false

    let decoded: string
    try {
        decoded = atob(encoded)
    } catch {
        return false
    }
    const [user, password] = decoded.split(':')

    const validUser = process.env.ADMIN_USER || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || ''

    return user === validUser && password === validPassword && validPassword !== ''
}

// Vérifie le secret interne (server-to-server) : cron Vercel + auto-enchaînement
// de la synchro. Vercel Cron envoie automatiquement `Bearer <CRON_SECRET>`.
function hasValidInternalSecret(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false
    return request.headers.get('authorization') === `Bearer ${secret}`
}

function unauthorized(json: boolean): NextResponse {
    if (json) {
        return new NextResponse(JSON.stringify({ error: 'Non autorisé' }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'WWW-Authenticate': 'Basic realm="Lynq Admin"',
            },
        })
    }
    return new NextResponse('Accès non autorisé', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Lynq Admin"' },
    })
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // UI admin : Basic Auth uniquement.
    if (pathname.startsWith('/admin')) {
        return hasValidBasicAuth(request) ? NextResponse.next() : unauthorized(false)
    }

    // Routes API sensibles : Basic Auth (navigateur admin) OU secret interne
    // (cron / auto-enchaînement de la synchro).
    const isProtectedApi =
        pathname.startsWith('/api/merchants') || pathname.startsWith('/api/gmc/')

    if (isProtectedApi) {
        if (hasValidBasicAuth(request) || hasValidInternalSecret(request)) {
            return NextResponse.next()
        }
        return unauthorized(true)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/merchants',
        '/api/merchants/:path*',
        '/api/gmc/:path*',
    ],
}
