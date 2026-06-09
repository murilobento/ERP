import { useRef } from 'react'
import api from '@/lib/api'
import { AsyncSearchCombobox } from '@/components/async-search-combobox'

export type KitSearchItem = {
  id: string
  name: string
  status: string
  items: {
    productId: string
    quantity: number
    product: {
      id: string
      name: string
      unit: string
    }
  }[]
  totalPrice: number
  discount: number
  finalPrice: number
}

type KitComboboxProps = {
  value: string
  onValueChange: (value: string) => void
  onItemChange?: (item: KitSearchItem | null) => void
  selectedItem?: KitSearchItem | null
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function KitCombobox({
  value,
  onValueChange,
  onItemChange,
  placeholder = 'Selecione o kit',
  disabled,
  className,
}: KitComboboxProps) {
  const itemsRef = useRef<KitSearchItem[]>([])

  function handleValueChange(newId: string) {
    onValueChange(newId)
    const item = itemsRef.current.find((i) => i.id === newId) ?? null
    onItemChange?.(item)
  }

  const fetchFn = (search: string) =>
    api
      .get('/kits/search', { params: { q: search, limit: 20 } })
      .then((r) => {
        const kits = r.data.kits as KitSearchItem[]
        itemsRef.current = kits
        return kits
      })

  return (
    <AsyncSearchCombobox<KitSearchItem>
      value={value}
      onValueChange={handleValueChange}
      fetchFn={fetchFn}
      queryKey={['kits-search']}
      renderItem={(item) => (
        <>
          <span className='truncate'>{item.name}</span>
          <span className='ms-auto shrink-0 text-xs text-muted-foreground'>
            R$ {item.finalPrice.toFixed(2)}
          </span>
        </>
      )}
      getDisplayLabel={(item) => item.name}
      placeholder={placeholder}
      searchPlaceholder='Buscar kit...'
      notFoundMessage='Nenhum kit encontrado.'
      disabled={disabled}
      className={className}
    />
  )
}
