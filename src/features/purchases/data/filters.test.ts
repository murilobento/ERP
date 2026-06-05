import { describe, expect, it } from 'vitest'
import { filterPurchases, isWithinRange } from './filters'
import { purchaseStatusMap, type Purchase } from './schema'

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 'purchase-1',
    vendorId: 'vendor-1',
    supplier: 'Fornecedor Bom',
    status: 'pending',
    notes: '',
    reversalReason: '',
    reversedBy: null,
    reversedAt: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    vendor: {
      id: 'vendor-1',
      name: 'Fornecedor Bom',
      phone: '(11) 99999-9999',
      status: 'active',
    },
    items: [
      {
        id: 'item-1',
        purchaseId: 'purchase-1',
        supplyId: 'supply-1',
        packages: 2,
        quantity: 10,
        packageCost: 12,
        supply: {
          id: 'supply-1',
          name: 'Farinha',
          unit: 'kg',
          packageUnit: 'saco',
          packageQuantity: 5,
        },
      },
    ],
    ...overrides,
  }
}

describe('purchase data filters', () => {
  it('keeps status labels stable', () => {
    expect(purchaseStatusMap.pending).toEqual({
      label: 'Pendente',
      variant: 'warning',
    })
    expect(purchaseStatusMap.completed).toEqual({
      label: 'Concluída',
      variant: 'success',
    })
  })

  it('matches purchases by free text on supplier, item or notes', () => {
    const purchases = [
      makePurchase({ id: 'p-1', supplier: 'Fornecedor Bom' }),
      makePurchase({
        id: 'p-2',
        supplier: 'Outro',
        notes: 'Reposição mensal',
      }),
      makePurchase({
        id: 'p-3',
        supplier: 'Outro',
        items: [
          {
            id: 'item-3',
            purchaseId: 'p-3',
            supplyId: 'supply-2',
            packages: 1,
            quantity: 5,
            packageCost: 0,
            supply: {
              id: 'supply-2',
              name: 'Açúcar',
              unit: 'kg',
              packageUnit: 'saco',
              packageQuantity: 5,
            },
          },
        ],
      }),
    ]

    expect(
      filterPurchases(purchases, { filter: 'fornecedor' }).map((p) => p.id)
    ).toEqual(['p-1'])
    expect(
      filterPurchases(purchases, { filter: 'reposição' }).map((p) => p.id)
    ).toEqual(['p-2'])
    expect(
      filterPurchases(purchases, { filter: 'açúcar' }).map((p) => p.id)
    ).toEqual(['p-3'])
  })

  it('filters by one or more statuses', () => {
    const purchases = [
      makePurchase({ id: 'p-1', status: 'pending' }),
      makePurchase({ id: 'p-2', status: 'completed' }),
    ]

    expect(
      filterPurchases(purchases, { status: ['pending'] }).map((p) => p.id)
    ).toEqual(['p-1'])
    expect(
      filterPurchases(purchases, {
        status: ['pending', 'completed'],
      }).map((p) => p.id)
    ).toEqual(['p-1', 'p-2'])
  })

  it('filters by completedAt within a range', () => {
    const purchases = [
      makePurchase({ id: 'p-1', completedAt: '2026-01-10T12:00:00.000Z' }),
      makePurchase({ id: 'p-2', completedAt: '2026-01-20T12:00:00.000Z' }),
      makePurchase({ id: 'p-3', completedAt: null }),
    ]

    expect(
      filterPurchases(purchases, {
        completedFrom: '2026-01-15',
        completedTo: '2026-01-31',
      }).map((p) => p.id)
    ).toEqual(['p-2'])

    expect(
      filterPurchases(purchases, {
        completedFrom: '2026-01-01',
        completedTo: '2026-01-31',
      }).map((p) => p.id)
    ).toEqual(['p-1', 'p-2'])
  })

  it('returns true when the range is open and false when date is missing', () => {
    expect(isWithinRange(null, '', '')).toBe(true)
    expect(isWithinRange(null, '2026-01-01', '2026-01-31')).toBe(false)
    expect(isWithinRange('2026-01-15T12:00:00.000Z', '', '')).toBe(true)
  })

  it('shows all purchases when no date filter is set', () => {
    const purchases = [
      makePurchase({ id: 'p-1', status: 'pending', completedAt: null }),
      makePurchase({ id: 'p-2', status: 'completed', completedAt: '2026-01-10T12:00:00.000Z' }),
    ]

    expect(
      filterPurchases(purchases, { completedFrom: '', completedTo: '' }).map((p) => p.id)
    ).toEqual(['p-1', 'p-2'])
  })
})
