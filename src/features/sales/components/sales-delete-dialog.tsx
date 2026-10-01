import { queryKeys } from '@/lib/query-keys'
import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Sale } from '../data/schema'

type SalesDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Sale
}

export function SalesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: SalesDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='sales'
      queryKey={queryKeys.sales}
      entityLabel='Venda'
      displayLabel={currentRow.customer}
      successMessage='Venda excluída com sucesso.'
      formId='sales-delete-form'
    />
  )
}
