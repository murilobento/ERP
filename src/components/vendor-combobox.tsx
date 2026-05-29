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

function useDebouncedValue(value: string, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}

export function VendorCombobox({
  value,
  onValueChange,
  onVendorChange,
  selectedVendor,
  status = 'active',
  limit = 20,
  placeholder = 'Selecione o fornecedor',
  disabled,
  className,
}: VendorComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalSelectedVendor, setInternalSelectedVendor] =
    useState<VendorSearchItem | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const selected = selectedVendor || internalSelectedVendor

  const { data: vendors = [], isFetching, isError } = useQuery({
    queryKey: ['vendors', 'search', debouncedSearch, status, limit],
    queryFn: async () => {
      const res = await api.get('/vendors/search', {
        params: { q: debouncedSearch, status, limit },
      })
      return res.data.vendors as VendorSearchItem[]
    },
    enabled: open && debouncedSearch.trim().length > 0,
  })

  const displayLabel = useMemo(() => {
    if (!value) return ''
    if (selected?.id === value) return selected.name
    return vendors.find((vendor) => vendor.id === value)?.name || ''
  }, [selected, value, vendors])

  function handleSelect(vendor: VendorSearchItem) {
    setInternalSelectedVendor(vendor)
    onValueChange(vendor.id)
    onVendorChange?.(vendor)
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
            placeholder='Buscar fornecedor...'
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
            ) : vendors.length === 0 ? (
              <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
            ) : (
              <CommandGroup>
                {vendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    value={vendor.id}
                    onSelect={() => handleSelect(vendor)}
                  >
                    <Check
                      className={cn(
                        'size-4',
                        value === vendor.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className='truncate'>{vendor.name}</span>
                    {vendor.phone && (
                      <span className='ms-auto shrink-0 text-xs text-muted-foreground'>
                        {vendor.phone}
                      </span>
                    )}
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
