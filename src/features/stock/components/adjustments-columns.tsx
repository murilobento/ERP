import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type StockAdjustment, stockAdjustmentStatusMap } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const adjustmentsColumns: ColumnDef<StockAdjustment>[] = [
  {
    id: 'item',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Item' />
    ),
    accessorFn: (row) => row.product?.name || row.supply?.name || '—',
    cell: ({ row }) => {
      const item = row.original.product || row.original.supply
      return <span className='ps-3 font-medium'>{item?.name || '—'}</span>
    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    id: 'itemType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tipo' />
    ),
    accessorFn: (row) => row.itemType,
    cell: ({ row }) => {
      const type = row.original.itemType
      return (
        <Badge variant='outline'>
          {type === 'product' ? 'Produto' : 'Insumo'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Quantidade' />
    ),
    cell: ({ row }) => {
      const qty = row.original.quantity
      const unit = row.original.product?.unit || row.original.supply?.unit || ''
      return (
        <span className={qty >= 0 ? 'text-green-600' : 'text-red-600'}>
          {qty > 0 ? '+' : ''}
          {qty} {unit}
        </span>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Motivo' />
    ),
    cell: ({ row }) => (
      <span className='line-clamp-2 max-w-48'>
        {row.original.reason || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as StockAdjustment['status']
      const config = stockAdjustmentStatusMap[status] || {
        label: status,
        variant: 'secondary' as const,
      }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    id: 'author',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Autor' />
    ),
    accessorFn: (row) => {
      if (!row.author) return ''
      return `${row.author.firstName} ${row.author.lastName}`
    },
    cell: ({ row }) => {
      const author = row.original.author
      if (!author) return <span className='text-muted-foreground'>—</span>
      return (
        <span>
          {author.firstName} {author.lastName}
        </span>
      )
    },
  },
  {
    accessorKey: 'completedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Concluído em' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('completedAt') as string | null
      if (!value) return <span className='text-muted-foreground'>—</span>
      const date = new Date(value)
      return <div className='text-nowrap'>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
