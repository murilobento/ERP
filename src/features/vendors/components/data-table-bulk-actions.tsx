import { type Table } from '@tanstack/react-table'
import { ContactBulkActions } from '@/features/shared/contact-bulk-actions'
import { type Vendor } from '../data/schema'

const vendorConfig = {
  entityLabel: 'Fornecedor',
  entityLabelLower: 'fornecedor',
  endpoint: 'vendors',
  queryKey: 'vendors',
  formId: 'vendor-form',
  namePlaceholder: 'Fornecedor Exemplo',
  entityPlural: 'fornecedores',
} as const

type DataTableBulkActionsProps = {
  table: Table<Vendor>
}

export function DataTableBulkActions({ table }: DataTableBulkActionsProps) {
  return <ContactBulkActions table={table} config={vendorConfig} />
}
