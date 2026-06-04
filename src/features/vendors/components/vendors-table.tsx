import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Vendor } from '../data/schema'
import { useVendors } from './vendors-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { vendorsColumns as columns } from './vendors-columns'

type DataTableProps = {
  data: Vendor[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function VendorsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useVendors()
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const { name, phone, street, number, neighborhood, city, state } =
        row.original
      const address = [street, number, neighborhood, city, state]
        .filter(Boolean)
        .join(', ')
        .toLowerCase()
      return (
        name.toLowerCase().includes(search) ||
        phone.toLowerCase().includes(search) ||
        address.includes(search)
      )
    },
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      searchPlaceholder='Filtrar por nome, telefone ou endereço...'
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('edit')
      }}
      labels={{
        name: 'Nome',
        phone: 'Telefone',
        address: 'Endereço',
        status: 'Status',
        createdAt: 'Criado em',
      }}
      bulkActions={<DataTableBulkActions table={table} />}
    />
  )
}
