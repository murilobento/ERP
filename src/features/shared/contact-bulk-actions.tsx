import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Power } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Contact, type ContactConfig } from './contact-types'

type ContactBulkActionsProps = {
  table: Table<Contact>
  config: ContactConfig
}

export function ContactBulkActions({ table, config }: ContactBulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const queryClient = useQueryClient()
  const allActive = selectedRows.every((r) => r.original.status === 'active')
  const newStatus = allActive ? 'inactive' : 'active'
  const label = allActive ? 'desativar' : 'ativar'

  const handleBulkToggle = async () => {
    const ids = selectedRows.map((row) => row.original.id)
    try {
      await Promise.all(ids.map((id) => api.patch(`/${config.endpoint}/${id}/status`, { status: newStatus })))
      toast.success(`${ids.length} ${config.entityLabelLower}${ids.length > 1 ? config.entityPlural !== config.entityLabelLower ? config.entityPlural : 's' : ''} ${allActive ? 'desativado' : 'ativado'}${ids.length > 1 ? 's' : ''}.`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    } catch (error: unknown) {
      handleServerError(error)
    }
    setShowConfirm(false)
  }

  if (selectedRows.length === 0) return null

  return (
    <>
      <BulkActionsToolbar table={table} entityName={config.entityLabelLower} entityNamePlural={config.entityPlural}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={allActive ? 'destructive' : 'default'}
              size='icon'
              onClick={() => setShowConfirm(true)}
              className='size-8'
              aria-label={`${label} ${config.entityPlural} selecionados`}
              title={`${label} ${config.entityPlural} selecionados`}
            >
              <Power />
              <span className='sr-only'>{`${label} ${config.entityPlural} selecionados`}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label.charAt(0).toUpperCase() + label.slice(1)} {config.entityPlural} selecionados</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={`${allActive ? 'Desativar' : 'Ativar'} ${selectedRows.length} ${config.entityLabelLower}${selectedRows.length > 1 ? config.entityPlural !== config.entityLabelLower ? config.entityPlural : 's' : ''}`}
        desc={`Tem certeza que deseja ${allActive ? 'desativar' : 'ativar'} ${selectedRows.length} ${config.entityLabelLower}${selectedRows.length > 1 ? config.entityPlural !== config.entityLabelLower ? config.entityPlural : 's' : ''} selecionado${selectedRows.length > 1 ? 's' : ''}?`}
        destructive={allActive}
        handleConfirm={handleBulkToggle}
        confirmText={allActive ? 'Desativar' : 'Ativar'}
      />
    </>
  )
}
