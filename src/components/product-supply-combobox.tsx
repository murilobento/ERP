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

export type ProductSupplySearchItem = {
  id: string
  name: string
  unit: string
  status?: string
  stock?: number
  packageUnit?: string
  packageQuantity?: number
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

function useDebouncedValue(value: string, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function ProductSupplyCombobox({
  type,
  value,
  onValueChange,
  onItemChange,
  selectedItem,
  status = 'active',
  includeStock = false,
  limit = 20,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled,
  className,
}: ProductSupplyComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalSelectedItem, setInternalSelectedItem] =
    useState<ProductSupplySearchItem | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const entityLabel = type === 'product' ? 'produto' : 'insumo'
  const endpoint = type === 'product' ? '/products/search' : '/supplies/search'
  const selected = selectedItem || internalSelectedItem

  const { data: items = [], isFetching, isError } = useQuery({
    queryKey: [
      type,
      'search',
      endpoint,
      debouncedSearch,
      status,
      includeStock,
      limit,
    ],
    queryFn: async () => {
      const res = await api.get(endpoint, {
        params: {
          q: debouncedSearch,
          status,
          includeStock,
          limit,
        },
      })
      return (type === 'product'
        ? res.data.products
        : res.data.supplies) as ProductSupplySearchItem[]
    },
    enabled: open && debouncedSearch.trim().length > 0,
  })

  const displayLabel = useMemo(() => {
    if (!value) return ''
    if (selected?.id === value) return selected.name
    const result = items.find((item) => item.id === value)
    return result?.name || ''
  }, [items, selected, value])

  function handleSelect(item: ProductSupplySearchItem) {
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
            {displayLabel || placeholder || `Selecione o ${entityLabel}`}
          </span>
          <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder || `Buscar ${entityLabel}...`}
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
              <CommandEmpty>
                {emptyMessage || `Nenhum ${entityLabel} encontrado.`}
              </CommandEmpty>
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
                      {item.unit}
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
