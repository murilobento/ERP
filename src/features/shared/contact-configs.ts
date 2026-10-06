import { queryKeys } from '@/lib/query-keys'

export const clientConfig = {
  entityLabel: 'Cliente',
  entityLabelLower: 'cliente',
  endpoint: 'clients',
  queryKey: queryKeys.clients,
  formId: 'client-form',
  namePlaceholder: 'João Silva',
  entityPlural: 'clientes',
  responseKey: 'client',
} as const

export const vendorConfig = {
  entityLabel: 'Fornecedor',
  entityLabelLower: 'fornecedor',
  endpoint: 'vendors',
  queryKey: queryKeys.vendors,
  formId: 'vendor-form',
  namePlaceholder: 'Fornecedor Exemplo',
  entityPlural: 'fornecedores',
  responseKey: 'vendor',
} as const
