import { useKits } from './kits-provider'
import { KitsActionDialog } from './kits-action-dialog'
import { KitsDeleteDialog } from './kits-delete-dialog'
import { KitsDetailDialog } from './kits-detail-dialog'

export function KitsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useKits()

  return (
    <>
      <KitsActionDialog
        key={`${open}-${currentRow?.id}`}
        open={open === 'add' || open === 'edit'}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 300)
          }
        }}
        currentRow={open === 'edit' ? currentRow : undefined}
      />
      <KitsDeleteDialog
        key={`delete-${currentRow?.id}`}
        open={open === 'delete'}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 300)
          }
        }}
        currentRow={currentRow}
      />
      <KitsDetailDialog
        key={`view-${currentRow?.id}`}
        open={open === 'view'}
        onOpenChange={(state) => {
          if (!state) {
            setOpen(null)
            setTimeout(() => setCurrentRow(null), 300)
          }
        }}
        currentRow={currentRow}
      />
    </>
  )
}
