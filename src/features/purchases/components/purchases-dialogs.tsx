import { PurchasesActionDialog } from './purchases-action-dialog'
import { PurchasesDeleteDialog } from './purchases-delete-dialog'
import { PurchasesDetailDialog } from './purchases-detail-dialog'
import { usePurchases } from './purchases-provider'

export function PurchasesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePurchases()
  return (
    <>
      {open === 'add' && (
        <PurchasesActionDialog
          key='purchase-add'
          mode='add'
          open
          onOpenChange={(state) => setOpen(state ? 'add' : null)}
        />
      )}
      {open === 'edit' && (
        <PurchasesActionDialog
          key='purchase-edit'
          mode='edit'
          open
          onOpenChange={(state) => setOpen(state ? 'edit' : null)}
        />
      )}
      <PurchasesDetailDialog />
      {currentRow && (
        <PurchasesDeleteDialog
          key={`purchase-delete-${currentRow.id}`}
          open={open === 'delete'}
          onOpenChange={(state) => {
            if (!state) {
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
