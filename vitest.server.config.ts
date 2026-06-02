import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/src/**/*.test.ts'],
    exclude: ['server/src/**/*.integration.test.ts'],
    globals: false,
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      include: ['server/src/**/*.ts'],
      exclude: ['server/src/index.ts', 'server/src/lib/prisma.ts', 'server/src/**/*.test.ts'],
    },
  },
})
