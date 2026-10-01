import { PurchasesActionDialog } from './purchases-action-dialog'
import { PurchasesDeleteDialog } from './purchases-delete-dialog'
import { PurchasesDetailDialog } from './purchases-detail-dialog'
import { usePurchases } from './purchases-provider'

export function PurchasesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePurchases()
  return (
    <>
      <PurchasesActionDialog
        key='purchase-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />
      <PurchasesActionDialog
        key='purchase-edit'
        open={open === 'edit'}
        onOpenChange={(state) => setOpen(state ? 'edit' : null)}
      />
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
