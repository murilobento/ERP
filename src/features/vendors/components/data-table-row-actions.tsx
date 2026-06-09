import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { UserPen, Power } from 'lucide-react'
import { toast } from 'sonner'
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
import { type Vendor } from '../data/schema'
import { useVendors } from './vendors-provider'

type DataTableRowActionsProps = {
  row: Row<Vendor>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useVendors()
  const queryClient = useQueryClient()
  const isActive = row.original.status === 'active'

  async function toggleStatus() {
    const newStatus = isActive ? 'inactive' : 'active'
    try {
      await api.patch(`/vendors/${row.original.id}/status`, { status: newStatus })
      await queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success(isActive ? 'Fornecedor desativado com sucesso.' : 'Fornecedor ativado com sucesso.')
    } catch {
      toast.error('Falha ao alterar status do fornecedor.')
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
            onClick={toggleStatus}
            className={isActive ? 'text-red-500!' : 'text-green-600!'}
          >
            {isActive ? 'Desativar' : 'Ativar'}
            <DropdownMenuShortcut>
              <Power size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
