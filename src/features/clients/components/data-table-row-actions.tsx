import { createContactRowActions } from '@/features/shared/contact-row-actions'
import { queryKeys } from '@/lib/query-keys'
import { useClients } from './clients-provider'

const clientConfig = {
  entityLabel: 'Cliente',
  entityLabelLower: 'cliente',
  endpoint: 'clients',
  queryKey: queryKeys.clients,
  formId: 'client-form',
  namePlaceholder: 'João Silva',
  entityPlural: 'clientes',
} as const

export const DataTableRowActions = createContactRowActions(clientConfig, useClients, true)
