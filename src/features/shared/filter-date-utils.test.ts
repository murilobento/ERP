import { describe, expect, it } from 'vitest'
import {
  formatDateInAppTimeZone,
  getDateRangeLabel,
  getPresetRange,
  isWithinRange,
  parseDateTimeLocalInAppTimeZone,
} from './filter-date-utils'

describe('application date utilities', () => {
  it('uses the Sao Paulo calendar day for UTC timestamps', () => {
    expect(formatDateInAppTimeZone('2026-01-01T02:59:59.999Z')).toBe(
      '2025-12-31'
    )
    expect(formatDateInAppTimeZone('2026-01-01T03:00:00.000Z')).toBe(
      '2026-01-01'
    )
  })

  it('does not shift a date-only API value', () => {
    expect(formatDateInAppTimeZone('2026-01-01')).toBe('2026-01-01')
  })

  it('includes the complete Sao Paulo day in a range', () => {
    expect(
      isWithinRange('2026-01-01T02:59:59.999Z', '2025-12-31', '2025-12-31')
    ).toBe(true)
    expect(
      isWithinRange('2026-01-01T03:00:00.000Z', '2026-01-01', '2026-01-01')
    ).toBe(true)
  })

  it('parses payment input as Sao Paulo local time', () => {
    expect(
      parseDateTimeLocalInAppTimeZone('2026-01-01T12:30')?.toISOString()
    ).toBe('2026-01-01T15:30:00.000Z')
  })

  it('shows filter ranges in dd/mm/aaaa while keeping yyyy-mm-dd values', () => {
    expect(getDateRangeLabel('2026-01-01', '2026-01-31')).toBe(
      '01/01/2026 até 31/01/2026'
    )
    expect(getDateRangeLabel('2026-01-01', '')).toBe('A partir de 01/01/2026')
    expect(getDateRangeLabel('', '2026-01-31')).toBe('Até 31/01/2026')
  })

  it('still prefers the preset label over a formatted range', () => {
    const today = getPresetRange('today')
    expect(getDateRangeLabel(today.from, today.to)).toBe('Hoje')
  })
})
