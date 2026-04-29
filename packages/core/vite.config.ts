import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@effector-tanstack-query/core',
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
  },
})
