import { describe, expect, it } from 'vitest'
import {
  formatDateInAppTimeZone,
  parseDateOnlyInAppTimeZone,
  parseDateTimeInAppTimeZone,
} from './date-time'

describe('server date utilities', () => {
  it('stores a date-only value at Sao Paulo midnight', () => {
    expect(parseDateOnlyInAppTimeZone('2026-01-01')?.toISOString()).toBe(
      '2026-01-01T03:00:00.000Z'
    )
  })

  it('rejects invalid date-only values', () => {
    expect(parseDateOnlyInAppTimeZone('2026-02-30')).toBeNull()
    expect(parseDateOnlyInAppTimeZone('01/01/2026')).toBeNull()
  })

  it('interprets datetime-local input in Sao Paulo', () => {
    expect(parseDateTimeInAppTimeZone('2026-01-01T12:30')?.toISOString()).toBe(
      '2026-01-01T15:30:00.000Z'
    )
  })

  it('serializes stored timestamps by Sao Paulo calendar day', () => {
    expect(formatDateInAppTimeZone(new Date('2026-01-01T02:59:59.999Z'))).toBe(
      '2025-12-31'
    )
    expect(formatDateInAppTimeZone(new Date('2026-01-01T03:00:00.000Z'))).toBe(
      '2026-01-01'
    )
  })
})
