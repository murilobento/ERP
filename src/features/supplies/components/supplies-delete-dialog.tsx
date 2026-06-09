import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Supply } from '../data/schema'

type SupplyDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Supply
}

export function SuppliesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: SupplyDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='supplies'
      queryKey={['supplies']}
      entityLabel='Insumo'
      successMessage='Insumo excluído com sucesso.'
      formId='supplies-delete-form'
    />
  )
}
