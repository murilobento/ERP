import { AdjustmentsActionDialog } from './adjustments-action-dialog'
import { AdjustmentsDetailDialog } from './adjustments-detail-dialog'
import { useAdjustments } from './adjustments-provider'

export function AdjustmentsDialogs() {
  const { open, setOpen } = useAdjustments()
  return (
    <>
      <AdjustmentsActionDialog
        key='adjustment-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />
      <AdjustmentsActionDialog
        key='adjustment-edit'
        open={open === 'edit'}
        onOpenChange={(state) => setOpen(state ? 'edit' : null)}
      />
      <AdjustmentsDetailDialog />
    </>
  )
}
