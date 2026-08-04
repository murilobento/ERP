export type DatePreset =
  'today' | 'tomorrow' | 'yesterday' | 'this_month' | 'last_month'

export type DatePresetOption = {
  value: DatePreset
  label: string
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
  const date = new Date(`${value}T00:00:00`)
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
  const base = new Date()
  base.setHours(0, 0, 0, 0)

  if (preset === 'today') {
    const value = formatFilterDate(base)
    return { from: value, to: value }
  }

  if (preset === 'tomorrow') {
    const tomorrow = new Date(base)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const value = formatFilterDate(tomorrow)
    return { from: value, to: value }
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(base)
    yesterday.setDate(yesterday.getDate() - 1)
    const value = formatFilterDate(yesterday)
    return { from: value, to: value }
  }

  if (preset === 'this_month') {
    const from = new Date(base.getFullYear(), base.getMonth(), 1)
    const to = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return { from: formatFilterDate(from), to: formatFilterDate(to) }
  }

  const from = new Date(base.getFullYear(), base.getMonth() - 1, 1)
  const to = new Date(base.getFullYear(), base.getMonth(), 0)
  return { from: formatFilterDate(from), to: formatFilterDate(to) }
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
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getDayEnd(value: string) {
  if (!value) return null
  const date = new Date(`${value}T23:59:59.999`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isWithinRange(
  dateValue: string | null,
  from: string,
  to: string
) {
  if (!from && !to) return true
  if (!dateValue) return false

  const date = new Date(dateValue)
  const start = getDayStart(from)
  const end = getDayEnd(to)

  if (Number.isNaN(date.getTime())) return false
  if (start && date < start) return false
  if (end && date > end) return false

  return true
}
