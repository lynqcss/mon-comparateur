import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    // Only protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const authHeader = request.headers.get('authorization')

        if (authHeader) {
            const [scheme, encoded] = authHeader.split(' ')
            if (scheme === 'Basic' && encoded) {
                const decoded = atob(encoded)
                const [user, password] = decoded.split(':')

                const validUser = process.env.ADMIN_USER || 'admin'
                const validPassword = process.env.ADMIN_PASSWORD || ''

                if (user === validUser && password === validPassword && validPassword !== '') {
                    return NextResponse.next()
                }
            }
        }

        return new NextResponse('Accès non autorisé', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Lynq Admin"',
            },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}
