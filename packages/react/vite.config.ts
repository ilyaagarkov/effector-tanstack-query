import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve workspace imports to source so vitest doesn't require a prior build.
    alias: {
      '@effector-tanstack-query/core': path.resolve(
        __dirname,
        '../core/src/index.ts',
      ),
    },
  },
  test: {
    name: '@effector-tanstack-query/react',
    dir: './src',
    watch: false,
    environment: 'jsdom',
    coverage: {
      enabled: true,
      provider: 'istanbul',
      include: ['src/**/*'],
      exclude: ['src/__tests__/**'],
    },
    typecheck: { enabled: true },
    restoreMocks: true,
    setupFiles: ['../../test-setup.ts'],
  },
})
