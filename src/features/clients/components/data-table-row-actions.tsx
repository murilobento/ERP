import { createContactRowActions } from '@/features/shared/contact-row-actions'
import { useClients } from './clients-provider'

const clientConfig = {
  entityLabel: 'Cliente',
  entityLabelLower: 'cliente',
  endpoint: 'clients',
  queryKey: 'clients',
  formId: 'client-form',
  namePlaceholder: 'João Silva',
  entityPlural: 'clientes',
} as const

export const DataTableRowActions = createContactRowActions(clientConfig, useClients, true)
