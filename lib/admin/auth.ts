import { isToolOpen, type ToolId } from './tools'

// ============================================================================
// Admin access checks, shared by the middleware and by every /api/admin route.
//
// Two locks on purpose: the middleware guards /admin and /api/admin, and each
// /api/admin route calls `requireAdmin()` again. A route forgotten by the
// middleware matcher therefore stays protected (a past mistake on the
// original tool: sending routes reachable without any access right).
//
// Pure functions with no Node API: they also run in the middleware (edge).
// ============================================================================

type Env = Record<string, string | undefined>

/** Constant-time string comparison (avoids leaking the password length match by timing). */
function safeEqual(a: string, b: string): boolean {
    let diff = a.length ^ b.length
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
    }
    return diff === 0
}

/** Admin credentials (Basic Auth), the single admin of the site. */
export function isAdminAuthorization(header: string | null, env: Env = process.env): boolean {
    const validPassword = env.ADMIN_PASSWORD || ''
    if (!header || validPassword === '') return false

    const [scheme, encoded] = header.split(' ')
    if (scheme !== 'Basic' || !encoded) return false

    let decoded: string
    try {
        decoded = atob(encoded)
    } catch {
        return false
    }
    // The password may contain ':' — only the first one separates the user.
    const separator = decoded.indexOf(':')
    if (separator < 0) return false
    const user = decoded.slice(0, separator)
    const password = decoded.slice(separator + 1)

    const validUser = env.ADMIN_USER || 'admin'
    return safeEqual(user, validUser) && safeEqual(password, validPassword)
}

/** Internal server-to-server secret (Vercel Cron, GitHub Actions, sync self-chaining). */
export function isInternalAuthorization(header: string | null, env: Env = process.env): boolean {
    const secret = env.CRON_SECRET
    if (!secret || !header) return false
    return safeEqual(header, `Bearer ${secret}`)
}

function json(status: number, error: string, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    })
}

/**
 * First line of every /api/admin route:
 *
 *     const denied = requireAdmin(request, { tool: 'alerts' })
 *     if (denied) return denied
 *
 * Returns a 401 response without admin rights, a 404 when the tool is not
 * open yet, or null when the request may proceed. `allowInternal` also lets
 * scheduled jobs in with the internal secret.
 */
export function requireAdmin(
    request: Request,
    options: { tool?: ToolId; allowInternal?: boolean } = {},
): Response | null {
    const header = request.headers.get('authorization')
    const allowed = isAdminAuthorization(header) || (options.allowInternal === true && isInternalAuthorization(header))
    if (!allowed) return json(401, 'Non autorisé', { 'WWW-Authenticate': 'Basic realm="Lynq Admin"' })
    if (options.tool && !isToolOpen(options.tool)) return json(404, 'Introuvable')
    return null
}
