import { DeleteEntityDialog } from '@/features/shared/delete-entity-dialog'
import { type Category } from '../data/schema'

type CategoryDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Category
}

export function CategoriesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: CategoryDeleteDialogProps) {
  return (
    <DeleteEntityDialog
      open={open}
      onOpenChange={onOpenChange}
      currentRow={currentRow}
      endpoint='categories'
      queryKey={['categories']}
      entityLabel='Categoria'
      successMessage='Categoria excluída com sucesso.'
      formId='categories-delete-form'
    />
  )
}
