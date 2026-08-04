import { queryKeys } from '@/lib/query-keys'
import { createContactRowActions } from '@/features/shared/contact-row-actions'
import { useVendors } from './vendors-provider'

const vendorConfig = {
  entityLabel: 'Fornecedor',
  entityLabelLower: 'fornecedor',
  endpoint: 'vendors',
  queryKey: queryKeys.vendors,
  formId: 'vendor-form',
  namePlaceholder: 'Fornecedor Exemplo',
  entityPlural: 'fornecedores',
} as const

export const DataTableRowActions = createContactRowActions(
  vendorConfig,
  useVendors,
  false
)
