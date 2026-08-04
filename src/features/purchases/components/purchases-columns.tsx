import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { DataTableColumnHeader } from '@/components/data-table'
import { purchaseStatusMap, type Purchase } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const purchasesColumns: ColumnDef<Purchase>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Selecionar todos'
        className='translate-y-0.5'
      />
    ),
    meta: {
      className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Selecionar linha'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'supplier',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fornecedor' />
    ),
    cell: ({ row }) => (
      <span className='ps-3 font-medium'>{row.getValue('supplier')}</span>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    id: 'itemCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Itens' />
    ),
    accessorFn: (row) => row.items?.length || 0,
    cell: ({ row }) => {
      const items = row.original.items || []
      const count = items.length
      const totalCost = items.reduce(
        (sum, i) => sum + i.packages * i.packageCost,
        0
      )
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className='cursor-default ps-2 text-primary underline decoration-dashed underline-offset-4'>
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className='w-auto min-w-72 p-3'>
            <div className='space-y-1.5'>
              {items.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-muted-foreground'>
                    {item.supply.name}
                  </span>
                  <span className='font-medium'>
                    {item.packages}{' '}
                    {item.supply.packageUnit || item.supply.unit} ×{' '}
                    {formatCurrency(item.packageCost)}
                  </span>
                </div>
              ))}
              <div className='mt-1.5 flex items-center justify-between border-t pt-1.5 text-sm font-semibold'>
                <span>Total</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
  },
  {
    id: 'totalPackages',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    accessorFn: (row) =>
      row.items?.reduce((sum, i) => sum + i.packages, 0) || 0,
    cell: ({ row }) => {
      const total =
        row.original.items?.reduce((sum, i) => sum + i.packages, 0) || 0
      return <span className='ps-2'>{total}</span>
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as Purchase['status']
      const config = purchaseStatusMap[status] || {
        label: status,
        variant: 'secondary' as const,
      }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  {
    accessorKey: 'completedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Concluída em' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('completedAt') as string | null
      if (!value) return <span className='text-muted-foreground'>—</span>
      const date = new Date(value)
      return <div className='text-nowrap'>{date.toLocaleDateString()}</div>
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
