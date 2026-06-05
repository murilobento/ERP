import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Client } from '../data/schema'
import { useClients } from './clients-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { clientsColumns as columns } from './clients-columns'

type DataTableProps = {
  data: Client[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ClientsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useClients()
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
        setOpen('view')
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
