import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './date-time'

describe('formatDate', () => {
  it('formats an ISO timestamp in dd/mm/aaaa using the app time zone', () => {
    // 03:00Z é meia-noite em São Paulo: o dia exibido não pode "voltar" um.
    expect(formatDate('2026-01-01T02:59:59.999Z')).toBe('31/12/2025')
    expect(formatDate('2026-01-01T03:00:00.000Z')).toBe('01/01/2026')
  })

  it('does not shift a date-only API value', () => {
    // new Date('2026-01-01') é meia-noite UTC; em São Paulo viraria 31/12.
    expect(formatDate('2026-01-01')).toBe('01/01/2026')
    expect(formatDate('2026-12-31')).toBe('31/12/2026')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
    expect(formatDate('data inválida')).toBe('')
  })
})

describe('formatDateTime', () => {
  it('formats an ISO timestamp as dd/mm/aaaa HH:mm', () => {
    expect(formatDateTime('2026-01-05T14:30:00.000Z')).toBe('05/01/2026 11:30')
    expect(formatDateTime('2026-01-01T02:59:59.999Z')).toBe('31/12/2025 23:59')
    expect(formatDateTime('2026-01-01T03:00:00.000Z')).toBe('01/01/2026 00:00')
  })

  it('keeps the 24-hour cycle after midnight', () => {
    expect(formatDateTime('2026-01-01T09:00:00.000Z')).toBe('01/01/2026 06:00')
  })

  it('omits the time for date-only values, which have none', () => {
    // Converter o meio-dia UTC geraria uma hora fictícia (21:00).
    expect(formatDateTime('2026-06-10')).toBe('10/06/2026')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
    expect(formatDateTime('')).toBe('')
    expect(formatDateTime('data inválida')).toBe('')
  })
})
