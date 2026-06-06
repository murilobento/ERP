import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type Product } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const productsColumns: ColumnDef<Product>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nome' />
    ),
    cell: ({ row }) => (
      <span className='ps-3 font-medium'>{row.getValue('name')}</span>
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
    accessorKey: 'unit',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Unidade' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 text-nowrap'>{row.getValue('unit')}</div>
    ),
  },
  {
    id: 'categoryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Categoria' />
    ),
    accessorFn: (row) => row.category?.name || '',
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <span className='ps-2'>{category?.name || '—'}</span>
      )
    },
  },
  {
    accessorKey: 'stock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estoque' />
    ),
    cell: ({ row }) => {
      const stock = row.getValue('stock') as number
      return (
        <Badge variant={stock > 0 ? 'default' : 'secondary'}>
          {stock}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'costPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Custo' />
    ),
    cell: ({ row }) => {
      const costPrice = row.getValue('costPrice') as number
      const unit = row.original.unit
      if (!costPrice) return <span className='text-muted-foreground'>—</span>
      return <span>R$ {costPrice.toFixed(2)}/{unit}</span>
    },
  },
  {
    accessorKey: 'margin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Margem' />
    ),
    cell: ({ row }) => {
      const margin = row.getValue('margin') as number
      return <span>{margin}%</span>
    },
  },
  {
    accessorKey: 'salePrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Venda' />
    ),
    cell: ({ row }) => {
      const salePrice = row.getValue('salePrice') as number
      const unit = row.original.unit
      if (!salePrice) return <span className='text-muted-foreground'>—</span>
      return <span>R$ {salePrice.toFixed(2)}/{unit}</span>
    },
  },
  {
    id: 'compositionCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Composição' />
    ),
    accessorFn: (row) => row.composition?.length || 0,
    cell: ({ row }) => {
      const composition = row.original.composition || []
      const count = composition.length
      const totalCost = composition.reduce(
        (sum, item) => sum + item.quantity * item.supply.costPrice,
        0
      )
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className='cursor-default ps-2 underline decoration-dashed underline-offset-4 text-primary'>
              {count} {count === 1 ? 'insumo' : 'insumos'}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className='w-auto min-w-72 p-3'>
            <div className='space-y-1.5'>
              {composition.map((item) => (
                <div
                  key={item.id}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-muted-foreground'>
                    {item.supply.name}
                  </span>
                  <span className='font-medium'>
                    {item.quantity} {item.supply.unit} ×{' '}
                    {formatCurrency(item.supply.costPrice)}
                  </span>
                </div>
              ))}
              <div className='mt-1.5 border-t pt-1.5 flex items-center justify-between text-sm font-semibold'>
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
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    filterFn: (row, columnId, filterValue) => {
      if (Array.isArray(filterValue)) {
        return filterValue.includes(row.getValue(columnId))
      }
      return row.getValue(columnId) === filterValue
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'categoryId',
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
