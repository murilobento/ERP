import { ContactActionDialog } from '@/features/shared/contact-action-dialog'
import { vendorConfig } from '@/features/shared/contact-configs'
import { type Vendor } from '../data/schema'

type VendorActionDialogProps = {
  currentRow?: Vendor
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntityCreated?: (vendor: Vendor) => void
}

export function VendorsActionDialog({
  currentRow,
  open,
  onOpenChange,
  onEntityCreated,
}: VendorActionDialogProps) {
  return (
    <ContactActionDialog
      config={vendorConfig}
      currentRow={currentRow}
      open={open}
      onOpenChange={onOpenChange}
      onEntityCreated={onEntityCreated}
    />
  )
}
