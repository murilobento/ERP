import { vendorConfig } from '@/features/shared/contact-configs'
import { createContactRowActions } from '@/features/shared/contact-row-actions'
import { useVendors } from './vendors-provider'

export const DataTableRowActions = createContactRowActions(
  vendorConfig,
  useVendors,
  false
)
