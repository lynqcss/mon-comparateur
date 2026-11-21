import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { config as middlewareConfig } from '@/middleware'
import { CSS_TOOLS, isToolOpen } from '@/lib/admin/tools'

const ROOT = path.resolve(__dirname, '..')

function listRouteFiles(dir: string): string[] {
    if (!existsSync(dir)) return []
    return readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) return listRouteFiles(full)
        return /^route\.(ts|tsx|js)$/.test(entry) ? [full] : []
    })
}

describe('admin API routes', () => {
    it('are all covered by the middleware', () => {
        expect(middlewareConfig.matcher).toContain('/admin/:path*')
        expect(middlewareConfig.matcher).toContain('/api/admin/:path*')
    })

    // Second lock: a route must check access by itself, even if the middleware
    // matcher were to miss it.
    it('each check admin rights in every exported handler', () => {
        for (const file of listRouteFiles(path.join(ROOT, 'app', 'api', 'admin'))) {
            const source = readFileSync(file, 'utf8')
            const handlers = source.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g) ?? []
            const checks = source.match(/requireAdmin\(/g) ?? []
            expect(checks.length, `${path.relative(ROOT, file)} must call requireAdmin() in each handler`).toBeGreaterThanOrEqual(
                handlers.length,
            )
        }
    })
})

describe('admin tools', () => {
    it('are closed in production while not active, open in development', () => {
        for (const tool of CSS_TOOLS) {
            expect(isToolOpen(tool.id, 'production')).toBe(tool.status === 'active')
            expect(isToolOpen(tool.id, 'development')).toBe(true)
        }
    })

    it('each lock their pages with assertToolOpen in their layout', () => {
        for (const tool of CSS_TOOLS) {
            const layout = path.join(ROOT, 'app', tool.href.replace(/^\//, ''), 'layout.tsx')
            expect(existsSync(layout), `${tool.href} needs a layout.tsx`).toBe(true)
            expect(readFileSync(layout, 'utf8')).toContain(`assertToolOpen('${tool.id}')`)
        }
    })
})
