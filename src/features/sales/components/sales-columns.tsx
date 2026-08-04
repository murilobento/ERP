import { type ColumnDef } from '@tanstack/react-table'
import { PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { DataTableColumnHeader } from '@/components/data-table'
import {
  formatCurrency,
  getSaleTotal,
  saleStatusMap,
  type Sale,
} from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const salesColumns: ColumnDef<Sale>[] = [
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
    accessorKey: 'customer',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cliente' />
    ),
    cell: ({ row }) => (
      <span className='ps-3 font-medium'>{row.getValue('customer')}</span>
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
      const total = getSaleTotal(row.original)
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className='cursor-default ps-2 text-primary underline decoration-dashed underline-offset-4'>
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          </HoverCardTrigger>
          <HoverCardContent className='w-auto min-w-72 p-3'>
            <div className='space-y-1.5'>
              {(() => {
                const standalone = items.filter((i) => !i.kitId)
                const byKit = new Map<
                  string,
                  {
                    kit: { name: string } | null | undefined
                    items: typeof items
                  }
                >()
                for (const item of items) {
                  if (!item.kitId) continue
                  if (!byKit.has(item.kitId)) {
                    byKit.set(item.kitId, { kit: item.kit, items: [] })
                  }
                  byKit.get(item.kitId)!.items.push(item)
                }
                return (
                  <>
                    {standalone.map((item, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between text-sm'
                      >
                        <span className='text-muted-foreground'>
                          {item.product.name}
                        </span>
                        <span className='font-medium'>
                          {item.quantity} {item.product.unit} ×{' '}
                          {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                    ))}
                    {Array.from(byKit.entries()).map(([kitId, group]) => (
                      <div key={kitId} className='space-y-1'>
                        <div className='flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400'>
                          <PackageCheck size={12} />
                          Kit: {group.kit?.name || 'Kit'}
                        </div>
                        {group.items.map((item, i) => (
                          <div
                            key={i}
                            className='flex items-center justify-between pl-3 text-sm'
                          >
                            <span className='text-muted-foreground'>
                              {item.product.name}
                            </span>
                            <span className='font-medium'>
                              {item.quantity} {item.product.unit} ×{' '}
                              {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )
              })()}
              <div className='mt-1.5 flex items-center justify-between border-t pt-1.5 text-sm font-semibold'>
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
  },
  {
    id: 'total',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Total' />
    ),
    accessorFn: (row) => getSaleTotal(row),
    cell: ({ row }) => (
      <span className='ps-2 font-medium'>
        {formatCurrency(getSaleTotal(row.original))}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as Sale['status']
      const config = saleStatusMap[status] || {
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
    accessorKey: 'deliveryDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Entrega' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('deliveryDate') as string | null
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
