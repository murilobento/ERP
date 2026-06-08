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

function useDebouncedValue(value: string, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function KitCombobox({
  value,
  onValueChange,
  onItemChange,
  selectedItem,
  placeholder,
  disabled,
  className,
}: KitComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalSelectedItem, setInternalSelectedItem] =
    useState<KitSearchItem | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const selected = selectedItem || internalSelectedItem

  const {
    data: items = [],
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['kits-search', debouncedSearch],
    queryFn: async () => {
      const res = await api.get('/kits/search', {
        params: { q: debouncedSearch, limit: 20 },
      })
      return res.data.kits as KitSearchItem[]
    },
    enabled: open && debouncedSearch.trim().length > 0,
  })

  const displayLabel = useMemo(() => {
    if (!value) return ''
    if (selected?.id === value) return selected.name
    const result = items.find((item) => item.id === value)
    return result?.name || ''
  }, [items, selected, value])

  function handleSelect(item: KitSearchItem) {
    setInternalSelectedItem(item)
    onValueChange(item.id)
    onItemChange?.(item)
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
          <span className='truncate'>
            {displayLabel || placeholder || 'Selecione o kit'}
          </span>
          <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-(--radix-popover-trigger-width) p-0'
        align='start'
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder='Buscar kit...'
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
            ) : items.length === 0 ? (
              <CommandEmpty>Nenhum kit encontrado.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item)}
                  >
                    <Check
                      className={cn(
                        'size-4',
                        value === item.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className='truncate'>{item.name}</span>
                    <span className='ms-auto shrink-0 text-xs text-muted-foreground'>
                      R$ {item.finalPrice.toFixed(2)}
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
