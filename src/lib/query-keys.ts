import { type QueryKey } from '@tanstack/react-query'

export const queryKeys = {
  users: ['users'] as const,
  clients: ['clients'] as const,
  vendors: ['vendors'] as const,
  categories: ['categories'] as const,
  products: ['products'] as const,
  supplies: ['supplies'] as const,
  kits: ['kits'] as const,
  productions: ['productions'] as const,
  purchases: ['purchases'] as const,
  sales: ['sales'] as const,
  auditLogs: ['audit-logs'] as const,
  company: ['company'] as const,
  companyPublic: ['company-public'] as const,

  stock: {
    adjustments: ['stock-adjustments'] as const,
    balances: ['stock-balances'] as const,
    movements: ['stock-movements'] as const,
    adjustment: (id: string): QueryKey => ['stock-adjustment', id],
  },

  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    analytics: ['dashboard', 'analytics'] as const,
  },

  production: (id: string): QueryKey => ['production', id],
  purchase: (id: string): QueryKey => ['purchase', id],
  sale: (id: string): QueryKey => ['sale', id],
  client: (id: string): QueryKey => ['client', id],
} satisfies Record<string, QueryKey | Record<string, QueryKey | ((id: string) => QueryKey)>>
