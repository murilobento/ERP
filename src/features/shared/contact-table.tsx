import { type ColumnDef, type Table } from '@tanstack/react-table'
import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type Contact } from './contact-types'

type ContactTableProps = {
  data: Contact[]
  columns: ColumnDef<Contact>[]
  search: Record<string, unknown>
  navigate: NavigateFn
  bulkActions: (table: Table<Contact>) => React.ReactNode
  onRowClick: (row: Contact) => void
}

export function ContactTable({
  data,
  columns,
  search,
  navigate,
  bulkActions,
  onRowClick,
}: ContactTableProps) {
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    defaultColumnVisibility: { createdAt: false },
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchStr = String(filterValue).toLowerCase()
      const { name, phone, street, number, neighborhood, city, state } =
        row.original
      const address = [street, number, neighborhood, city, state]
        .filter(Boolean)
        .join(', ')
        .toLowerCase()
      return (
        name.toLowerCase().includes(searchStr) ||
        phone.toLowerCase().includes(searchStr) ||
        address.includes(searchStr)
      )
    },
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      searchPlaceholder='Filtrar por nome, telefone ou endereço...'
      filters={[
        {
          columnId: 'status',
          title: 'Status',
          options: [
            { label: 'Ativo', value: 'active' },
            { label: 'Inativo', value: 'inactive' },
          ],
        },
      ]}
      onRowClick={onRowClick}
      labels={{
        name: 'Nome',
        phone: 'Telefone',
        address: 'Endereço',
        status: 'Status',
        createdAt: 'Criado em',
      }}
      bulkActions={bulkActions(table)}
    />
  )
}
