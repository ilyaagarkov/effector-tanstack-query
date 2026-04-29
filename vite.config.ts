import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'effector-tanstack-query',
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
    setupFiles: ['test-setup.ts'],
  },
})
