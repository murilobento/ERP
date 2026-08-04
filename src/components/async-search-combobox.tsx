import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
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

export type SearchItem = {
  id: string
  name: string
}

type AsyncSearchComboboxProps<T extends SearchItem> = {
  value: string
  onValueChange: (value: string) => void
  fetchFn: (search: string) => Promise<T[]>
  queryKey: string[]
  renderItem: (item: T) => React.ReactNode
  getDisplayLabel: (item: T) => string
  placeholder?: string
  searchPlaceholder?: string
  notFoundMessage?: string
  disabled?: boolean
  className?: string
}

export function AsyncSearchCombobox<T extends SearchItem>({
  value,
  onValueChange,
  fetchFn,
  queryKey,
  renderItem,
  getDisplayLabel,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  notFoundMessage = 'Nenhum resultado encontrado.',
  disabled,
  className,
}: AsyncSearchComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  const {
    data: items = [],
    isFetching,
    isError,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
  } = useQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: () => fetchFn(debouncedSearch),
    enabled: open && debouncedSearch.trim().length > 0,
  })

  const displayLabel = useMemo(() => {
    if (!value) return ''
    if (selectedItem?.id === value) return getDisplayLabel(selectedItem)
    const found = items.find((item) => item.id === value)
    return found ? getDisplayLabel(found) : ''
  }, [value, selectedItem, items, getDisplayLabel])

  function handleSelect(item: T) {
    setSelectedItem(item)
    onValueChange(item.id)
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
      <PopoverContent
        className='w-(--radix-popover-trigger-width) p-0'
        align='start'
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
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
              <CommandEmpty>{notFoundMessage}</CommandEmpty>
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
                    {renderItem(item)}
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
