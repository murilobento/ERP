import { useRef } from 'react'
import api from '@/lib/api'
import { AsyncSearchCombobox } from '@/components/async-search-combobox'

export type ProductSupplySearchItem = {
  id: string
  name: string
  unit: string
  status?: string
  stock?: number
  packageUnit?: string
  packageQuantity?: number
  costPrice?: number
  salePrice?: number
}

type ProductSupplyComboboxProps = {
  type: 'product' | 'supply'
  value: string
  onValueChange: (value: string) => void
  onItemChange?: (item: ProductSupplySearchItem | null) => void
  selectedItem?: ProductSupplySearchItem | null
  status?: 'active' | 'all'
  includeStock?: boolean
  limit?: number
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function ProductSupplyCombobox({
  type,
  value,
  onValueChange,
  onItemChange,
  status = 'active',
  includeStock = false,
  limit = 20,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  className,
}: ProductSupplyComboboxProps) {
  const itemsRef = useRef<ProductSupplySearchItem[]>([])
  const entityLabel = type === 'product' ? 'produto' : 'insumo'
  const endpoint = type === 'product' ? '/products/search' : '/supplies/search'

  function handleValueChange(newId: string) {
    onValueChange(newId)
    const item = itemsRef.current.find((i) => i.id === newId) ?? null
    onItemChange?.(item)
  }

  const fetchFn = (search: string) =>
    api
      .get(endpoint, {
        params: { q: search, status, includeStock, limit },
      })
      .then((r) => {
        const items = (
          type === 'product' ? r.data.products : r.data.supplies
        ) as ProductSupplySearchItem[]
        itemsRef.current = items
        return items
      })

  return (
    <AsyncSearchCombobox<ProductSupplySearchItem>
      value={value}
      onValueChange={handleValueChange}
      fetchFn={fetchFn}
      queryKey={[
        type,
        'search',
        endpoint,
        status || 'active',
        String(includeStock),
        String(limit || 20),
      ]}
      renderItem={(item) => (
        <>
          <span className='truncate'>{item.name}</span>
          <span className='ms-auto shrink-0 text-xs text-muted-foreground'>
            {item.unit}
          </span>
        </>
      )}
      getDisplayLabel={(item) => item.name}
      placeholder={placeholder || `Selecione o ${entityLabel}`}
      searchPlaceholder={searchPlaceholder || `Buscar ${entityLabel}...`}
      notFoundMessage={emptyMessage || `Nenhum ${entityLabel} encontrado.`}
      disabled={disabled}
      className={className}
    />
  )
}
