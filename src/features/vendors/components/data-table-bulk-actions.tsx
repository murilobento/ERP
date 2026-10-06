import { type Table } from '@tanstack/react-table'
import { ContactBulkActions } from '@/features/shared/contact-bulk-actions'
import { vendorConfig } from '@/features/shared/contact-configs'
import { type Vendor } from '../data/schema'

type DataTableBulkActionsProps = {
  table: Table<Vendor>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  return <ContactBulkActions table={table} config={vendorConfig} />
}
