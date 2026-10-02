export const APP_TIME_ZONE = 'America/Sao_Paulo'

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function getParts(date: Date) {
  return Object.fromEntries(
    partsFormatter.formatToParts(date).map(({ type, value }) => [type, value])
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute', string>
}

function toDate(value: string | Date) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const raw = value.trim()
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Exibição de datas no padrão brasileiro (dd/mm/aaaa) e sempre no fuso do
 * app (America/Sao_Paulo), para que a data mostrada seja a mesma usada nos
 * filtros eindependentemente do fuso do navegador.
 *
 * Valores date-only da API ("2026-01-15") são reescritos sem conversão: passar
 * por Date + fuso jogaria o dia para 14/01.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  if (typeof value === 'string') {
    const raw = value.trim()
    if (DATE_ONLY_PATTERN.test(raw)) {
      const [year, month, day] = raw.split('-')
      return `${day}/${month}/${year}`
    }
  }
  const date = toDate(value)
  if (!date) return ''
  const parts = getParts(date)
  return `${parts.day}/${parts.month}/${parts.year}`
}

/**
 * Data e hora no padrão brasileiro (dd/mm/aaaa HH:mm). Como a API envia
 * timestamps ISO (createdAt, paidAt, reversedAt...), a conversão para o fuso do
 * app é obrigatória — só a hora exibida muda, o dia continua o de São Paulo.
 *
 * Valores date-only da API ("2026-01-15") saem sem hora: eles não têm horário,
 * e converter o meio-dia UTC para o fuso do app produziria uma hora fictícia
 * (15/01/2026 21:00).
 */
export function formatDateTime(
  value: Date | string | null | undefined
): string {
  if (!value) return ''
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())) {
    return formatDate(value)
  }
  const date = toDate(value)
  if (!date) return ''
  const parts = getParts(date)
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}
