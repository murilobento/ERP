import { useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Purchase } from '../data/schema'

type DataTableBulkActionsProps = {
  table: Table<Purchase>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()
  const pendingRows = selectedRows.filter(
    (row) => row.original.status === 'pending'
  )

  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        pendingRows.map((row) =>
          api.post(`/purchases/${row.original.id}/complete`)
        )
      )
      toast.success(
        `${pendingRows.length} compra${pendingRows.length > 1 ? 's' : ''} concluída${pendingRows.length > 1 ? 's' : ''}. Estoque atualizado.`
      )
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      queryClient.invalidateQueries({ queryKey: ['stock-balances'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    } catch (error: unknown) {
      handleServerError(error)
    }
  }

  if (selectedRows.length === 0) return null

  return (
    <BulkActionsToolbar
      table={table}
      entityName='compra'
      entityNamePlural='compras'
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size='icon'
            onClick={handleBulkComplete}
            disabled={pendingRows.length === 0}
            className='size-8'
            aria-label='Concluir compras pendentes selecionadas'
            title='Concluir compras pendentes selecionadas'
          >
            <CheckCircle2 />
            <span className='sr-only'>
              Concluir compras pendentes selecionadas
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Concluir compras pendentes selecionadas</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
