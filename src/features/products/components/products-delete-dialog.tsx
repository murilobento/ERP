import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Product } from '../data/schema'

type ProductDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Product
}

export function ProductsDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: ProductDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='products'
      queryKey={['products']}
      entityLabel='Produto'
      successMessage='Produto excluído com sucesso.'
      formId='products-delete-form'
    />
  )
}
