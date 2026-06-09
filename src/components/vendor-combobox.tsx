import { useRef } from 'react'
import api from '@/lib/api'
import { AsyncSearchCombobox } from '@/components/async-search-combobox'

export type VendorSearchItem = {
  id: string
  name: string
  phone?: string
  status?: string
}

type VendorComboboxProps = {
  value: string
  onValueChange: (value: string) => void
  onVendorChange?: (vendor: VendorSearchItem | null) => void
  selectedVendor?: VendorSearchItem | null
  status?: 'active' | 'all'
  limit?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function VendorCombobox({
  value,
  onValueChange,
  onVendorChange,
  status = 'active',
  limit = 20,
  placeholder = 'Selecione o fornecedor',
  disabled,
  className,
}: VendorComboboxProps) {
  const itemsRef = useRef<VendorSearchItem[]>([])

  function handleValueChange(newId: string) {
    onValueChange(newId)
    const item = itemsRef.current.find((i) => i.id === newId) ?? null
    onVendorChange?.(item)
  }

  const fetchFn = (search: string) =>
    api
      .get('/vendors/search', { params: { q: search, status, limit } })
      .then((r) => {
        const vendors = r.data.vendors as VendorSearchItem[]
        itemsRef.current = vendors
        return vendors
      })

  return (
    <AsyncSearchCombobox<VendorSearchItem>
      value={value}
      onValueChange={handleValueChange}
      fetchFn={fetchFn}
      queryKey={['vendors', 'search', status || 'active', String(limit || 20)]}
      renderItem={(item) => (
        <>
          <span className='truncate'>{item.name}</span>
          {item.phone && (
            <span className='ms-auto shrink-0 text-xs text-muted-foreground'>
              {item.phone}
            </span>
          )}
        </>
      )}
      getDisplayLabel={(item) => item.name}
      placeholder={placeholder}
      searchPlaceholder='Buscar fornecedor...'
      notFoundMessage='Nenhum fornecedor encontrado.'
      disabled={disabled}
      className={className}
    />
  )
}
