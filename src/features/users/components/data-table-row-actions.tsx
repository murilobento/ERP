import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { UserPen, Power } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'

type DataTableRowActionsProps = {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const queryClient = useQueryClient()
  const isActive = row.original.status === 'active'
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function toggleStatus() {
    setIsLoading(true)
    const newStatus = isActive ? 'inactive' : 'active'
    try {
      await api.patch(`/users/${row.original.id}/status`, { status: newStatus })
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(isActive ? 'Usuário desativado com sucesso.' : 'Usuário ativado com sucesso.')
    } catch (error: unknown) {
      handleServerError(error)
    } finally {
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-48'>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Editar
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowConfirm(true)}
            className={isActive ? 'text-red-500!' : 'text-green-600!'}
          >
            {isActive ? 'Desativar' : 'Ativar'}
            <DropdownMenuShortcut>
              <Power size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={isActive ? 'Desativar usuário' : 'Ativar usuário'}
        desc={`Tem certeza que deseja ${isActive ? 'desativar' : 'ativar'} este usuário?`}
        destructive={isActive}
        isLoading={isLoading}
        handleConfirm={toggleStatus}
        confirmText={isActive ? 'Desativar' : 'Ativar'}
      />
    </>
  )
}
