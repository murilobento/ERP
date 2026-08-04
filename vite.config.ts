import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const apiPort = Number(process.env.API_PORT) || 3001

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('/@tanstack/')) {
            return 'vendor-tanstack'
          }
          if (id.includes('/@radix-ui/')) {
            return 'vendor-radix'
          }
          if (
            id.includes('/react-hook-form/') ||
            id.includes('/@hookform/') ||
            id.includes('/zod/')
          ) {
            return 'vendor-forms'
          }
          if (id.includes('/date-fns/') || id.includes('/react-day-picker/')) {
            return 'vendor-date'
          }
          if (id.includes('/recharts/')) {
            return 'vendor-charts'
          }
          if (id.includes('/lucide-react/')) {
            return 'vendor-icons'
          }

          return 'vendor'
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      '@tanstack/react-query',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      'cmdk',
      'date-fns',
      'date-fns/locale',
      'react-day-picker',
    ],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['server/**'],
    silent: 'passed-only',
    unstubEnvs: true,
    fileParallelism: false,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
    coverage: {
      exclude: [
        'src/components/ui/**',
        'src/assets/**',
        'src/tanstack-table.d.ts',
        'src/routeTree.gen.ts',
        'src/test-utils/**',
        'src/routes/**',
      ],
    },
  },
})
