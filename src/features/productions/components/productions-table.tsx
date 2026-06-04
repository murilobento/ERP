import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Production } from '../data/schema'
import { useProductions } from './productions-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { productionsColumns as columns } from './productions-columns'

type DataTableProps = {
  data: Production[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ProductionsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useProductions()
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const items = row.original.items?.length
        ? row.original.items
        : [{ product: row.original.product }]
      return items.some((item) =>
        item.product.name.toLowerCase().includes(search)
      )
    },
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      searchPlaceholder='Filtrar por produto...'
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('view')
      }}
      labels={{
        product: 'Produto',
        quantity: 'Quantidade',
        status: 'Status',
        createdAt: 'Criado em',
      }}
      bulkActions={<DataTableBulkActions table={table} />}
    />
  )
}
