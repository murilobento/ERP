import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { SalesDialogs } from '@/features/sales/components/sales-dialogs'
import {
  SalesProvider,
  useSales,
} from '@/features/sales/components/sales-provider'
import { ClientsActionDialog } from './clients-action-dialog'
import { ClientsDetailDialog } from './clients-detail-dialog'
import { useClients } from './clients-provider'

function SalesDialogCloseSync({ clientId }: { clientId: string }) {
  const { open } = useSales()
  const queryClient = useQueryClient()
  const wasOpen = useRef(false)

  useEffect(() => {
    if (wasOpen.current && open === null) {
      queryClient.invalidateQueries({ queryKey: queryKeys.client(clientId) })
    }
    wasOpen.current = open !== null
  }, [open, clientId, queryClient])

  return null
}

export function ClientsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useClients()
  return (
    <>
      <ClientsActionDialog
        key='client-add'
        open={open === 'add'}
        onOpenChange={() => setOpen('add')}
      />

      {currentRow && (
        <SalesProvider>
          <SalesDialogCloseSync clientId={currentRow.id} />

          <ClientsDetailDialog
            key={`client-view-${currentRow.id}`}
            open={open === 'view'}
            onOpenChange={() => {
              setOpen('view')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <ClientsActionDialog
            key={`client-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <SalesDialogs />
        </SalesProvider>
      )}
    </>
  )
}
