import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/src/**/*.integration.test.ts'],
    globals: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    silent: 'passed-only',
  },
})
