import { type NavigateFn } from '@/hooks/use-table-url-state'
import { DataTableShell } from '@/features/shared/data-table-shell'
import { useDataTable } from '@/features/shared/use-data-table'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { usersColumns as columns } from './users-columns'

type DataTableProps = {
  data: User[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function UsersTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const { table } = useDataTable({
    data,
    columns,
    search,
    navigate,
    defaultColumnVisibility: { createdAt: false },
    globalFilterEnabled: false,
  })

  return (
    <DataTableShell
      table={table}
      columnCount={columns.length}
      searchPlaceholder='Filtrar usuários...'
      searchKey='fullName'
      filters={[]}
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('edit')
      }}
      bulkActions={<DataTableBulkActions table={table} />}
    />
  )
}
