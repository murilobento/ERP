import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import {
  CheckCircle2,
  Eye,
  FileText,
  PackageCheck,
  Pen,
  RotateCcw,
  Trash2,
  Truck,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Sale } from '../data/schema'
import { downloadInvoice } from '../lib/download-invoice'
import { useSales } from './sales-provider'

type DataTableRowActionsProps = {
  row: Row<Sale>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useSales()
  const { auth } = useAuthStore()
  const sale = row.original
  const canDelete =
    (sale.status === 'in_preparation' ||
      sale.status === 'ready_for_delivery') &&
    (auth.user?.role === 'admin' || auth.user?.role === 'manager')

  async function handleInvoice() {
    try {
      await downloadInvoice(sale.id)
    } catch (error: unknown) {
      handleServerError(error)
    }
  }

  return (
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
            setCurrentRow(sale)
            setOpen('view')
          }}
        >
          Ver Detalhes
          <DropdownMenuShortcut>
            <Eye size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        {sale.status !== 'completed' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(sale)
              setOpen('edit')
            }}
          >
            Editar
            <DropdownMenuShortcut>
              <Pen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {sale.status === 'in_preparation' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(sale)
              setOpen('ready-for-delivery')
            }}
          >
            Pronto para Entrega
            <DropdownMenuShortcut>
              <Truck size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {sale.status === 'ready_for_delivery' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(sale)
              setOpen('deliver')
            }}
          >
            Entregar
            <DropdownMenuShortcut>
              <PackageCheck size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {sale.status === 'delivered' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(sale)
              setOpen('complete')
            }}
          >
            Concluir
            <DropdownMenuShortcut>
              <CheckCircle2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {sale.status === 'completed' && (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(sale)
              setOpen('reverse')
            }}
            className='text-red-500!'
          >
            Estornar
            <DropdownMenuShortcut>
              <RotateCcw size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(sale)
                setOpen('delete')
              }}
              className='text-red-500!'
            >
              Excluir
              <DropdownMenuShortcut>
                <Trash2 size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleInvoice}>
          Gerar Fatura
          <DropdownMenuShortcut>
            <FileText size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
