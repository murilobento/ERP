import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Power } from 'lucide-react'
import { useEntityMutation } from '@/lib/use-entity-mutation'
import { queryKeys } from '@/lib/query-keys'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type User } from '../data/schema'

type DataTableBulkActionsProps = {
  table: Table<User>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const { run } = useEntityMutation()
  const allActive = selectedRows.every((r) => r.original.status === 'active')
  const newStatus = allActive ? 'inactive' : 'active'
  const label = allActive ? 'desativar' : 'ativar'

  const handleBulkToggle = async () => {
    const ids = selectedRows.map((row) => row.original.id)
    await run({
      mutation: () =>
        Promise.all(
          ids.map((id) =>
            api.patch(`/users/${id}/status`, { status: newStatus })
          )
        ),
      invalidate: [queryKeys.users],
      successMessage: `${ids.length} usuário${ids.length > 1 ? 's' : ''} ${allActive ? 'desativado' : 'ativado'}${ids.length > 1 ? 's' : ''}.`,
      onSuccess: () => table.resetRowSelection(),
    })
    setShowConfirm(false)
  }

  if (selectedRows.length === 0) return null

  return (
    <>
      <BulkActionsToolbar table={table} entityName='usuário'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={allActive ? 'destructive' : 'default'}
              size='icon'
              onClick={() => setShowConfirm(true)}
              className='size-8'
              aria-label={`${label} usuários selecionados`}
              title={`${label} usuários selecionados`}
            >
              <Power />
              <span className='sr-only'>{`${label} usuários selecionados`}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label.charAt(0).toUpperCase() + label.slice(1)} usuários selecionados</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`${allActive ? 'Desativar' : 'Ativar'} ${selectedRows.length} usuário${selectedRows.length > 1 ? 's' : ''}`}
        desc={`Tem certeza que deseja ${allActive ? 'desativar' : 'ativar'} ${selectedRows.length} usuário${selectedRows.length > 1 ? 's' : ''} selecionado${selectedRows.length > 1 ? 's' : ''}?`}
        destructive={allActive}
        handleConfirm={handleBulkToggle}
        confirmText={allActive ? 'Desativar' : 'Ativar'}
      />
    </>
  )
}
