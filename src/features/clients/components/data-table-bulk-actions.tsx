import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Client } from '../data/schema'

type DataTableBulkActionsProps = {
  table: Table<Client>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()
  const allActive = selectedRows.every((r) => r.original.status === 'active')
  const newStatus = allActive ? 'inactive' : 'active'
  const label = allActive ? 'desativar' : 'ativar'

  const handleBulkToggle = async () => {
    const ids = selectedRows.map((row) => row.original.id)
    try {
      await Promise.all(ids.map((id) => api.patch(`/clients/${id}/status`, { status: newStatus })))
      toast.success(`${ids.length} cliente${ids.length > 1 ? 's' : ''} ${allActive ? 'desativado' : 'ativado'}${ids.length > 1 ? 's' : ''}.`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    } catch {
      toast.error('Falha ao alterar status de alguns clientes.')
    }
    setShowConfirm(false)
  }

  if (selectedRows.length === 0) return null

  return (
    <>
      <BulkActionsToolbar table={table} entityName='cliente'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={allActive ? 'destructive' : 'default'}
              size='icon'
              onClick={() => setShowConfirm(true)}
              className='size-8'
              aria-label={`${label} clientes selecionados`}
              title={`${label} clientes selecionados`}
            >
              <Power />
              <span className='sr-only'>{`${label} clientes selecionados`}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label.charAt(0).toUpperCase() + label.slice(1)} clientes selecionados</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      {showConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='rounded-lg border bg-background p-6 shadow-lg'>
            <h3 className='text-lg font-semibold'>{label.charAt(0).toUpperCase() + label.slice(1)} {selectedRows.length} cliente{selectedRows.length > 1 ? 's' : ''}?</h3>
            <div className='mt-4 flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
              <Button variant={allActive ? 'destructive' : 'default'} onClick={handleBulkToggle}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
