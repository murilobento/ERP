import { clientConfig } from '@/features/shared/contact-configs'
import { createContactRowActions } from '@/features/shared/contact-row-actions'
import { useClients } from './clients-provider'

export const DataTableRowActions = createContactRowActions(
  clientConfig,
  useClients,
  true
)
