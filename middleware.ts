import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthorization, isInternalAuthorization } from '@/lib/admin/auth'

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
    const authorization = request.headers.get('authorization')

    // UI admin : Basic Auth uniquement.
    if (pathname.startsWith('/admin')) {
        return isAdminAuthorization(authorization) ? NextResponse.next() : unauthorized(false)
    }

    // Routes API sensibles : Basic Auth (navigateur admin) OU secret interne
    // (cron, GitHub Actions, auto-enchaînement de la synchro). Chaque route
    // /api/admin revérifie elle-même l'accès avec requireAdmin().
    const isProtectedApi =
        pathname.startsWith('/api/admin') ||
        pathname.startsWith('/api/merchants') ||
        pathname.startsWith('/api/gmc/')

    if (isProtectedApi) {
        if (isAdminAuthorization(authorization) || isInternalAuthorization(authorization)) {
            return NextResponse.next()
        }
        return unauthorized(true)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/admin/:path*',
        '/api/merchants',
        '/api/merchants/:path*',
        '/api/gmc/:path*',
    ],
}
