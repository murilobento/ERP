import { lazy, Suspense } from 'react'
import { useSales } from './sales-provider'

const SalesActionDialog = lazy(() =>
  import('./sales-action-dialog').then((module) => ({
    default: module.SalesActionDialog,
  }))
)
const SalesDetailDialog = lazy(() =>
  import('./sales-detail-dialog').then((module) => ({
    default: module.SalesDetailDialog,
  }))
)
const SalesKanbanActionDialog = lazy(() =>
  import('./sales-kanban-action-dialog').then((module) => ({
    default: module.SalesKanbanActionDialog,
  }))
)
const BestSellingDialog = lazy(() =>
  import('./best-selling-dialog').then((module) => ({
    default: module.BestSellingDialog,
  }))
)

export function SalesDialogs() {
  const { open, setOpen, currentRow, kanbanAction } = useSales()
  return (
    <Suspense fallback={null}>
      {open === 'add' ? (
        <SalesActionDialog
          key='sale-add'
          open
          onOpenChange={(state) => setOpen(state ? 'add' : null)}
        />
      ) : null}
      {open === 'edit' ? (
        <SalesActionDialog
          key={`sale-edit-${currentRow?.id ?? 'none'}-open`}
          open
          onOpenChange={(state) => setOpen(state ? 'edit' : null)}
        />
      ) : null}
      {open === 'view' ? <SalesDetailDialog /> : null}
      {open === 'best-selling' ? (
        <BestSellingDialog
          open
          onOpenChange={(state) => setOpen(state ? 'best-selling' : null)}
        />
      ) : null}
      {kanbanAction ? <SalesKanbanActionDialog /> : null}
    </Suspense>
  )
}
