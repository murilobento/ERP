import { SuppliesActionDialog } from './supplies-action-dialog'
import { SuppliesDeleteDialog } from './supplies-delete-dialog'
import { useSupplies } from './supplies-provider'

export function SuppliesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useSupplies()
  return (
    <>
      <SuppliesActionDialog
        key='supply-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <>
          <SuppliesActionDialog
            key={`supply-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <SuppliesDeleteDialog
            key={`supply-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
