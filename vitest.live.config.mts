import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Read-only checks against the real Google APIs (GET only, nothing written).
export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
    },
    test: {
        include: ['tests/live/**/*.test.ts'],
        environment: 'node',
    },
})
