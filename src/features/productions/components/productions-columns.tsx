import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Production } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const statusMap: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'success'
  }
> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  in_production: { label: 'Em Produção', variant: 'default' },
  completed: { label: 'Concluída', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

function getProductionItems(row: Production) {
  return row.items?.length
    ? row.items
    : [
        {
          id: row.id,
          productId: row.productId,
          quantity: row.quantity,
          product: row.product,
        },
      ]
}

export const productionsColumns: ColumnDef<Production>[] = [
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
    accessorKey: 'product',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Produto' />
    ),
    cell: ({ row }) => {
      const items = getProductionItems(row.original)
      const firstItem = items[0]
      return (
        <span className='ps-3 font-medium'>
          {firstItem.product.name}
          {items.length > 1 && (
            <span className='ms-2 text-xs font-normal text-muted-foreground'>
              +{items.length - 1} itens
            </span>
          )}
        </span>
      )
    },
    accessorFn: (row) =>
      getProductionItems(row)
        .map((item) => item.product.name)
        .join(' '),
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
    cell: ({ row }) => {
      const items = getProductionItems(row.original)
      const firstItem = items[0]

      return (
        <div className='ps-2 text-nowrap'>
          {firstItem.quantity} {firstItem.product.unit}
          {items.length > 1 && (
            <span className='ms-2 text-xs text-muted-foreground'>
              em {items.length} itens
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const config = statusMap[status] || {
        label: status,
        variant: 'secondary' as const,
      }
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
