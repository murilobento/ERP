import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Sale } from '../data/schema'
import { salesColumns as columns } from './sales-columns'
import { useSales } from './sales-provider'

type SalesTableProps = {
  data: Sale[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function SalesTable({ data, search, navigate }: SalesTableProps) {
  const { setOpen, setCurrentRow } = useSales()
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    defaultColumnVisibility: { createdAt: false },
    globalFilterEnabled: false,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const { customer, notes, items } = row.original
      return (
        customer.toLowerCase().includes(search) ||
        (notes || '').toLowerCase().includes(search) ||
        items.some((item) => item.product.name.toLowerCase().includes(search))
      )
    },
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      showSearch={false}
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('view')
      }}
      labels={{
        customer: 'Cliente',
        itemCount: 'Itens',
        total: 'Total',
        status: 'Status',
        createdAt: 'Criado em',
        deliveryDate: 'Entrega',
      }}
    />
  )
}
