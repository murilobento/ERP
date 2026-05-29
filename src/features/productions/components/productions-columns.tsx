import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Production } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  in_production: { label: 'Em Produção', variant: 'default' },
  completed: { label: 'Concluída', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

export const productionsColumns: ColumnDef<Production>[] = [
  {
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Produto' />
    ),
    cell: ({ row }) => (
      <span className='ps-3 font-medium'>{row.original.product.name}</span>
    ),
    accessorFn: (row) => row.product.name,
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Quantidade' />
    ),
    cell: ({ row }) => (
      <div className='ps-2 text-nowrap'>
        {row.original.quantity} {row.original.product.unit}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const config = statusMap[status] || { label: status, variant: 'secondary' as const }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Criado em' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return <div className='text-nowrap'>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
