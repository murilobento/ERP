import { ContactActionDialog } from '@/features/shared/contact-action-dialog'
import { type Client } from '../data/schema'

const clientConfig = {
  entityLabel: 'Cliente',
  entityLabelLower: 'cliente',
  endpoint: 'clients',
  queryKey: 'clients',
  formId: 'client-form',
  namePlaceholder: 'João Silva',
  entityPlural: 'clientes',
} as const

type ClientActionDialogProps = {
  currentRow?: Client
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: ClientActionDialogProps) {
  return (
    <ContactActionDialog
      config={clientConfig}
      currentRow={currentRow}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
