import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Kit } from '../data/schema'

type KitsDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Kit | null
}

export function KitsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: KitsDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='kits'
      queryKey={['kits']}
      entityLabel='Kit'
      successMessage='Kit excluído com sucesso.'
      formId='kits-delete-form'
    />
  )
}
