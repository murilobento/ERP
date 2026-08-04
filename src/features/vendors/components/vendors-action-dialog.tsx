import { queryKeys } from '@/lib/query-keys'
import { ContactActionDialog } from '@/features/shared/contact-action-dialog'
import { type Vendor } from '../data/schema'

const vendorConfig = {
  entityLabel: 'Fornecedor',
  entityLabelLower: 'fornecedor',
  endpoint: 'vendors',
  queryKey: queryKeys.vendors,
  formId: 'vendor-form',
  namePlaceholder: 'Fornecedor Exemplo',
  entityPlural: 'fornecedores',
} as const

type VendorActionDialogProps = {
  currentRow?: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VendorsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: VendorActionDialogProps) {
  return (
    <ContactActionDialog
      config={vendorConfig}
      currentRow={currentRow}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
