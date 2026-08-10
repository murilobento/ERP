export type DatePreset =
  'today' | 'tomorrow' | 'yesterday' | 'this_month' | 'last_month'

export type DatePresetOption = {
  value: DatePreset
  label: string
}

export const APP_TIME_ZONE = 'America/Sao_Paulo'

const datePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function getDateParts(date: Date) {
  return Object.fromEntries(
    datePartsFormatter
      .formatToParts(date)
      .map(({ type, value }) => [type, value])
  ) as Record<'year' | 'month' | 'day', string>
}

export function formatDateInAppTimeZone(value: Date | string) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return isValidFilterDate(value) ? value : ''
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = getDateParts(date)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatDateTimeInAppTimeZone(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatDateTimeLocalInAppTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  )
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

export function parseDateTimeLocalInAppTimeZone(value: string) {
  if (!value) return undefined
  const date = new Date(`${value}:00-03:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export const datePresetOptions: DatePresetOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'tomorrow', label: 'Amanhã' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
]

export const datePresetOptionsShort: DatePresetOption[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'last_month', label: 'Mês passado' },
]

export function parseFilterDate(value: string) {
  if (!value) return undefined
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : formatDateInAppTimeZone(value)
  if (!dateValue) return undefined
  const [year, month, day] = dateValue.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function formatFilterDate(date: Date | undefined) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPresetRange(preset: DatePreset) {
  const today = getDateParts(new Date())
  const base = new Date(
    Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day))
  )

  const formatUtcDate = (date: Date) => date.toISOString().slice(0, 10)

  if (preset === 'today') {
    const value = formatUtcDate(base)
    return { from: value, to: value }
  }

  if (preset === 'tomorrow') {
    const tomorrow = new Date(base)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const value = formatUtcDate(tomorrow)
    return { from: value, to: value }
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(base)
    yesterday.setDate(yesterday.getDate() - 1)
    const value = formatUtcDate(yesterday)
    return { from: value, to: value }
  }

  if (preset === 'this_month') {
    const from = new Date(base.getFullYear(), base.getMonth(), 1)
    const to = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return { from: formatUtcDate(from), to: formatUtcDate(to) }
  }

  const from = new Date(base.getFullYear(), base.getMonth() - 1, 1)
  const to = new Date(base.getFullYear(), base.getMonth(), 0)
  return { from: formatUtcDate(from), to: formatUtcDate(to) }
}

export function getDatePresetLabel(from: string, to: string) {
  const preset = datePresetOptions.find((option) => {
    const range = getPresetRange(option.value)
    return from === range.from && to === range.to
  })

  return preset?.label
}

export function getDateRangeLabel(from: string, to: string) {
  const presetLabel = getDatePresetLabel(from, to)
  if (presetLabel) return presetLabel
  if (from && to) return `${from} até ${to}`
  if (from) return `A partir de ${from}`
  if (to) return `Até ${to}`
  return ''
}

export function isPresetActive(preset: DatePreset, from: string, to: string) {
  const range = getPresetRange(preset)
  return range.from === from && range.to === to
}

export function getDayStart(value: string) {
  if (!value) return null
  return isValidFilterDate(value) ? value : null
}

export function getDayEnd(value: string) {
  if (!value) return null
  return isValidFilterDate(value) ? value : null
}

function isValidFilterDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return date.toISOString().slice(0, 10) === value
}

export function isWithinRange(
  dateValue: string | null,
  from: string,
  to: string
) {
  if (!from && !to) return true
  if (!dateValue) return false

  const date = formatDateInAppTimeZone(dateValue)
  const start = getDayStart(from)
  const end = getDayEnd(to)

  if (!date) return false
  if (start && date < start) return false
  if (end && date > end) return false

  return true
}
