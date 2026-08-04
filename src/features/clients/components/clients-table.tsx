import { type NavigateFn } from '@/hooks/use-table-url-state'
import { ContactTable } from '@/features/shared/contact-table'
import { type Client } from '../data/schema'
import { clientsColumns as columns } from './clients-columns'
import { useClients } from './clients-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'

type DataTableProps = {
  data: Client[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ClientsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useClients()

  return (
    <ContactTable
      data={data}
      columns={columns}
      search={search}
      navigate={navigate}
      bulkActions={(table) => <DataTableBulkActions table={table} />}
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('view')
      }}
    />
  )
}
