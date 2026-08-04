import { type NavigateFn } from '@/hooks/use-table-url-state'
import { ContactTable } from '@/features/shared/contact-table'
import { type Vendor } from '../data/schema'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { vendorsColumns as columns } from './vendors-columns'
import { useVendors } from './vendors-provider'

type DataTableProps = {
  data: Vendor[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function VendorsTable({ data, search, navigate }: DataTableProps) {
  const { setOpen, setCurrentRow } = useVendors()

  return (
    <ContactTable
      data={data}
      columns={columns}
      search={search}
      navigate={navigate}
      bulkActions={(table) => <DataTableBulkActions table={table} />}
      onRowClick={(row) => {
        setCurrentRow(row)
        setOpen('edit')
      }}
    />
  )
}
