import { queryKeys } from '@/lib/query-keys'
import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Purchase } from '../data/schema'

type PurchasesDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Purchase
}

export function PurchasesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: PurchasesDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='purchases'
      queryKey={queryKeys.purchases}
      entityLabel='Compra'
      displayLabel={currentRow.supplier}
      confirmMode='simple'
      successMessage='Compra excluída com sucesso.'
      formId='purchases-delete-form'
    />
  )
}
