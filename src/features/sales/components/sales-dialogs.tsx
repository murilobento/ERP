import { SalesActionDialog } from './sales-action-dialog'
import { SalesDetailDialog } from './sales-detail-dialog'
import { SalesKanbanActionDialog } from './sales-kanban-action-dialog'
import { useSales } from './sales-provider'

export function SalesDialogs() {
  const { open, setOpen, currentRow } = useSales()
  return (
    <>
      <SalesActionDialog
        key='sale-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />
      <SalesActionDialog
        key={`sale-edit-${currentRow?.id ?? 'none'}-${open === 'edit' ? 'open' : 'closed'}`}
        open={open === 'edit'}
        onOpenChange={(state) => setOpen(state ? 'edit' : null)}
      />
      <SalesDetailDialog />
      <SalesKanbanActionDialog />
    </>
  )
}
