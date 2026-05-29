import { PurchasesActionDialog } from './purchases-action-dialog'
import { PurchasesDetailDialog } from './purchases-detail-dialog'
import { usePurchases } from './purchases-provider'

export function PurchasesDialogs() {
  const { open, setOpen } = usePurchases()
  return (
    <>
      <PurchasesActionDialog
        key='purchase-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />
      <PurchasesActionDialog
        key='purchase-edit'
        open={open === 'edit'}
        onOpenChange={() => setOpen('edit')}
      />
      <PurchasesDetailDialog />
    </>
  )
}
