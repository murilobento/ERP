import { ContactActionDialog } from '@/features/shared/contact-action-dialog'
import { clientConfig } from '@/features/shared/contact-configs'
import { type Client } from '../data/schema'

type ClientActionDialogProps = {
  currentRow?: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntityCreated?: (client: Client) => void
}

export function ClientsActionDialog({
  currentRow,
  open,
  onOpenChange,
  onEntityCreated,
}: ClientActionDialogProps) {
  return (
    <ContactActionDialog
      config={clientConfig}
      currentRow={currentRow}
      open={open}
      onOpenChange={onOpenChange}
      onEntityCreated={onEntityCreated}
    />
  )
}
