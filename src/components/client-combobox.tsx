import { useRef } from 'react'
import api from '@/lib/api'
import { AsyncSearchCombobox } from '@/components/async-search-combobox'

export type ClientSearchItem = {
  id: string
  name: string
  phone: string
  status: string
}

type ClientComboboxProps = {
  value: string
  onValueChange: (value: string) => void
  onClientChange?: (client: ClientSearchItem | null) => void
  selectedClient?: ClientSearchItem | null
  status?: 'active' | 'all'
  limit?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ClientCombobox({
  value,
  onValueChange,
  onClientChange,
  status = 'active',
  limit = 20,
  placeholder = 'Selecione o cliente',
  disabled,
  className,
}: ClientComboboxProps) {
  const itemsRef = useRef<ClientSearchItem[]>([])

  function handleValueChange(newId: string) {
    onValueChange(newId)
    const item = itemsRef.current.find((i) => i.id === newId) ?? null
    onClientChange?.(item)
  }

  const fetchFn = (search: string) =>
    api
      .get('/clients/search', { params: { q: search, status, limit } })
      .then((r) => {
        const clients = r.data.clients as ClientSearchItem[]
        itemsRef.current = clients
        return clients
      })

  return (
    <AsyncSearchCombobox<ClientSearchItem>
      value={value}
      onValueChange={handleValueChange}
      fetchFn={fetchFn}
      queryKey={['clients', 'search', status || 'active', String(limit || 20)]}
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
      searchPlaceholder='Buscar cliente...'
      notFoundMessage='Nenhum cliente encontrado.'
      disabled={disabled}
      className={className}
    />
  )
}
