import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Purchase } from '../data/schema'
import { usePurchases } from './purchases-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { purchasesColumns as columns } from './purchases-columns'

type DataTableProps = {
  data: Purchase[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function PurchasesTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = usePurchases()
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    globalFilterEnabled: false,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const { supplier, notes, items } = row.original
      return (
        supplier.toLowerCase().includes(search) ||
        (notes || '').toLowerCase().includes(search) ||
        items.some((item) => item.supply.name.toLowerCase().includes(search))
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
        supplier: 'Fornecedor',
        itemCount: 'Itens',
        totalPackages: 'Total',
        status: 'Status',
        completedAt: 'Concluída em',
        createdAt: 'Criado em',
      }}
      bulkActions={<DataTableBulkActions table={table} />}
    />
  )
}
