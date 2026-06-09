import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Client } from '../data/schema'

type ClientsDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Client | null
}

export function ClientsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: ClientsDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='clients'
      queryKey={['clients']}
      entityLabel='Cliente'
      successMessage='Cliente excluído com sucesso.'
      formId='clients-delete-form'
    />
  )
}
