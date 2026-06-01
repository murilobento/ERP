import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

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

function useDebouncedValue(value: string, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function ClientCombobox({
  value,
  onValueChange,
  onClientChange,
  selectedClient,
  status = 'active',
  limit = 20,
  placeholder = 'Selecione o cliente',
  disabled,
  className,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalSelectedClient, setInternalSelectedClient] =
    useState<ClientSearchItem | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const selected = selectedClient || internalSelectedClient

  const { data: clients = [], isFetching, isError } = useQuery({
    queryKey: ['clients', 'search', debouncedSearch, status, limit],
    queryFn: async () => {
      const res = await api.get('/clients/search', {
        params: { q: debouncedSearch, status, limit },
      })
      return res.data.clients as ClientSearchItem[]
    },
    enabled: open && debouncedSearch.trim().length > 0,
  })

  const displayLabel = useMemo(() => {
    if (!value) return ''
    if (selected?.id === value) return selected.name
    return clients.find((client) => client.id === value)?.name || ''
  }, [clients, selected, value])

  function handleSelect(client: ClientSearchItem) {
    setInternalSelectedClient(client)
    onValueChange(client.id)
    onClientChange?.(client)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className='truncate'>{displayLabel || placeholder}</span>
          <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder='Buscar cliente...'
          />
          <CommandList>
            {!search.trim() ? (
              <CommandEmpty>Digite para buscar.</CommandEmpty>
            ) : isFetching ? (
              <CommandGroup>
                <CommandItem disabled>
                  <Loader2 className='animate-spin' />
                  Buscando...
                </CommandItem>
              </CommandGroup>
            ) : isError ? (
              <CommandEmpty>Falha ao buscar.</CommandEmpty>
            ) : clients.length === 0 ? (
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            ) : (
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                  >
                    <Check
                      className={cn(
                        'size-4',
                        value === client.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className='truncate'>{client.name}</span>
                    <span className='ms-auto shrink-0 text-xs text-muted-foreground'>
                      {client.phone}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
