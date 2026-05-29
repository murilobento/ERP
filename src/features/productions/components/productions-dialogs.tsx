import { ProductionsActionDialog } from './productions-action-dialog'
import { ProductionsDetailDialog } from './productions-detail-dialog'
import { useProductions } from './productions-provider'

export function ProductionsDialogs() {
  const { open, setOpen } = useProductions()
  return (
    <>
      <ProductionsActionDialog
        key='production-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      <ProductionsDetailDialog />
    </>
  )
}
