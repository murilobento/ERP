import { ContactPrimaryButtons } from '@/features/shared/contact-primary-buttons'
import { queryKeys } from '@/lib/query-keys'
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

export function VendorsPrimaryButtons() {
  const { setOpen } = useVendors()
  return <ContactPrimaryButtons config={vendorConfig} onAdd={() => setOpen('add')} />
}
