import { type ReactNode } from 'react'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/date-picker'
import {
  type DatePreset,
  type DatePresetOption,
  datePresetOptionsShort,
  parseFilterDate,
  formatFilterDate,
  getPresetRange,
  isPresetActive,
} from '@/features/shared/filter-date-utils'

type FilterShellProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  dialogTitle: string
  dialogDescription: string
  activeFilterCount: number
  hasRemovableFilters: boolean
  onReset: () => void
  summaryItems: string[]
  children: ReactNode
}

export function FilterShell({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  dialogTitle,
  dialogDescription,
  activeFilterCount,
  hasRemovableFilters,
  onReset,
  summaryItems,
  children,
}: FilterShellProps) {
  return (
    <div className='grid gap-2 rounded-md border bg-muted/20 p-2'>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className='h-8 min-w-0 bg-background px-2 text-sm lg:flex-1'
        />
        <div className='grid grid-cols-[1fr_auto] gap-2 sm:flex sm:justify-end'>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 justify-start bg-background px-2 text-xs sm:min-w-32 sm:justify-center'
              >
                <Filter className='size-4' />
                Filtros
                {activeFilterCount > 0 && (
                  <span className='rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground'>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl'>
              <DialogHeader className='text-start'>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>{dialogDescription}</DialogDescription>
              </DialogHeader>

              <div className='grid gap-5'>{children}</div>

              <DialogFooter className='gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={onReset}
                  disabled={!hasRemovableFilters}
                >
                  <X className='size-4' />
                  Redefinir
                </Button>
                <DialogClose asChild>
                  <Button type='button'>Aplicar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant='ghost'
            size='sm'
            onClick={onReset}
            disabled={!hasRemovableFilters}
            className='h-8 justify-center px-2 text-xs'
            title='Redefinir filtros'
          >
            <X className='size-4' />
            <span className='sr-only sm:not-sr-only'>Redefinir</span>
          </Button>
        </div>
      </div>

      {summaryItems.length > 0 && (
        <div className='flex gap-1.5 overflow-x-auto pb-0.5'>
          {summaryItems.map((item) => (
            <span
              key={item}
              className='inline-flex h-6 shrink-0 items-center rounded-md border bg-background px-2 text-xs text-muted-foreground'
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type FilterSectionProps<T extends string> = {
  title: string
  description: string
  options: { value: T; label: string }[]
  selected: T[]
  onToggle: (value: T) => void
  showBorderTop?: boolean
}

export function FilterSection<T extends string>({
  title,
  description,
  options,
  selected,
  onToggle,
  showBorderTop = false,
}: FilterSectionProps<T>) {
  return (
    <section className={`grid gap-2${showBorderTop ? 'border-t pt-4' : ''}`}>
      <div>
        <h3 className='text-sm font-medium'>{title}</h3>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <div className='flex flex-wrap gap-1.5'>
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <Button
              key={option.value}
              type='button'
              variant={isSelected ? 'default' : 'outline'}
              size='sm'
              onClick={() => onToggle(option.value)}
              className='h-8 px-2 text-xs data-[variant=outline]:bg-background'
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </section>
  )
}

type FilterDateSectionProps = {
  title: string
  description: string
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  presets?: DatePresetOption[]
}

export function FilterDateSection({
  title,
  description,
  from,
  to,
  onFromChange,
  onToChange,
  presets = datePresetOptionsShort,
}: FilterDateSectionProps) {
  function applyPreset(preset: DatePreset) {
    const range = getPresetRange(preset)
    onFromChange(range.from)
    onToChange(range.to)
  }

  return (
    <section className='grid gap-3 border-t pt-4'>
      <div>
        <h3 className='text-sm font-medium'>{title}</h3>
        <p className='text-xs text-muted-foreground'>{description}</p>
      </div>
      <div className='grid gap-2 sm:grid-cols-2'>
        <DatePicker
          selected={parseFilterDate(from)}
          onSelect={(date) => onFromChange(formatFilterDate(date))}
          placeholder='De'
          className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
        />
        <DatePicker
          selected={parseFilterDate(to)}
          onSelect={(date) => onToChange(formatFilterDate(date))}
          placeholder='Até'
          className='h-8 w-full min-w-0 bg-background px-2 text-xs sm:text-sm'
        />
      </div>
      <div className='-mx-0.5 overflow-x-auto pb-0.5'>
        <div className='flex min-w-max gap-1 px-0.5'>
          {presets.map((option) => {
            const selected = isPresetActive(option.value, from, to)
            return (
              <Button
                key={option.value}
                type='button'
                variant={selected ? 'default' : 'outline'}
                size='sm'
                onClick={() => applyPreset(option.value)}
                className={cn(
                  'h-7 px-2 text-[11px] whitespace-nowrap',
                  !selected && 'bg-background'
                )}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
