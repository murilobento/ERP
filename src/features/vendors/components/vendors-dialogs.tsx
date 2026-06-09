import { VendorsActionDialog } from './vendors-action-dialog'
import { useVendors } from './vendors-provider'

export function VendorsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useVendors()
  return (
    <>
      <VendorsActionDialog
        key='vendor-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <VendorsActionDialog
          key={`vendor-edit-${currentRow.id}`}
          open={open === 'edit'}
          onOpenChange={() => {
            setOpen('edit')
            setTimeout(() => {
              setCurrentRow(null)
            }, 500)
          }}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
