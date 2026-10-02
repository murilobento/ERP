import { describe, expect, it } from 'vitest'
import { formatUnitPrice } from './formatters'

// Intl usa espaço não separável (U+00A0) entre "R$" e o número.
const nbsp = '\u00a0'

describe('formatUnitPrice', () => {
  it('keeps the extra decimals a sub-cent rate needs', () => {
    // 100 g a R$ 0,008/g = R$ 0,80. Arredondar para 2 casas mostraria
    // "R$ 0,01" e a conferência da composição fecharia errado.
    expect(formatUnitPrice(0.008)).toBe(`R$${nbsp}0,008`)
  })

  it('does not pad rates that already fit in two decimals', () => {
    expect(formatUnitPrice(0.8)).toBe(`R$${nbsp}0,80`)
    expect(formatUnitPrice(2.1)).toBe(`R$${nbsp}2,10`)
    expect(formatUnitPrice(0)).toBe(`R$${nbsp}0,00`)
  })

  it('rounds beyond the fourth decimal', () => {
    expect(formatUnitPrice(0.12345)).toBe(`R$${nbsp}0,1235`)
    expect(formatUnitPrice(1 / 3)).toBe(`R$${nbsp}0,3333`)
  })

  it('does not leak float noise', () => {
    expect(formatUnitPrice(0.1 + 0.2)).toBe(`R$${nbsp}0,30`)
  })
})
