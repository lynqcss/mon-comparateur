import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
    },
    test: {
        include: ['tests/**/*.test.ts'],
        // Live tests call Google for real: run on demand with `npm run test:live`.
        exclude: [...configDefaults.exclude, 'tests/live/**'],
        environment: 'node',
    },
})
