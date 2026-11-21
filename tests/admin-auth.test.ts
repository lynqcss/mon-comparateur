import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAdminAuthorization, isInternalAuthorization, requireAdmin } from '@/lib/admin/auth'

const ENV = { ADMIN_USER: 'boss', ADMIN_PASSWORD: 's3cret:with-colon', CRON_SECRET: 'cron-secret' }
const basic = (user: string, password: string) => `Basic ${btoa(`${user}:${password}`)}`

function request(authorization?: string): Request {
    return new Request('http://localhost/api/admin/x', {
        headers: authorization ? { authorization } : {},
    })
}

describe('isAdminAuthorization', () => {
    it('accepts the right credentials, including a password containing ":"', () => {
        expect(isAdminAuthorization(basic('boss', 's3cret:with-colon'), ENV)).toBe(true)
    })

    it('refuses a missing, malformed or wrong header', () => {
        expect(isAdminAuthorization(null, ENV)).toBe(false)
        expect(isAdminAuthorization('Bearer cron-secret', ENV)).toBe(false)
        expect(isAdminAuthorization('Basic !!!not-base64', ENV)).toBe(false)
        expect(isAdminAuthorization(`Basic ${btoa('no-colon')}`, ENV)).toBe(false)
        expect(isAdminAuthorization(basic('boss', 'wrong'), ENV)).toBe(false)
        expect(isAdminAuthorization(basic('boss', 's3cret'), ENV)).toBe(false)
        expect(isAdminAuthorization(basic('intruder', 's3cret:with-colon'), ENV)).toBe(false)
    })

    it('refuses everyone when no admin password is configured', () => {
        expect(isAdminAuthorization(basic('admin', ''), { ADMIN_USER: 'admin', ADMIN_PASSWORD: '' })).toBe(false)
        expect(isAdminAuthorization(basic('admin', ''), {})).toBe(false)
    })
})

describe('isInternalAuthorization', () => {
    it('accepts only the exact internal secret', () => {
        expect(isInternalAuthorization('Bearer cron-secret', ENV)).toBe(true)
        expect(isInternalAuthorization('Bearer other', ENV)).toBe(false)
        expect(isInternalAuthorization(null, ENV)).toBe(false)
    })

    it('refuses everyone when no secret is configured', () => {
        expect(isInternalAuthorization('Bearer ', {})).toBe(false)
        expect(isInternalAuthorization('Bearer undefined', {})).toBe(false)
    })
})

describe('requireAdmin', () => {
    afterEach(() => vi.unstubAllEnvs())

    function stubEnv(nodeEnv: string) {
        vi.stubEnv('NODE_ENV', nodeEnv)
        for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value)
    }

    it('answers 401 without admin rights', () => {
        stubEnv('production')
        expect(requireAdmin(request())?.status).toBe(401)
        expect(requireAdmin(request(basic('boss', 'wrong')))?.status).toBe(401)
    })

    it('lets the admin through', () => {
        stubEnv('production')
        expect(requireAdmin(request(basic('boss', 's3cret:with-colon')))).toBeNull()
    })

    it('accepts the internal secret only when the route allows it', () => {
        stubEnv('production')
        expect(requireAdmin(request('Bearer cron-secret'))?.status).toBe(401)
        expect(requireAdmin(request('Bearer cron-secret'), { allowInternal: true })).toBeNull()
    })

    it('answers 404 in production for a tool that is not active yet', () => {
        stubEnv('production')
        expect(requireAdmin(request(basic('boss', 's3cret:with-colon')), { tool: 'newsletter' })?.status).toBe(404)
    })

    it('keeps tools under construction open in local development', () => {
        stubEnv('development')
        expect(requireAdmin(request(basic('boss', 's3cret:with-colon')), { tool: 'newsletter' })).toBeNull()
    })
})
