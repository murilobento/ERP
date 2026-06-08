import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  getSaleTotal,
  paymentMethodMap,
  saleStatusMap,
} from './schema'

describe('sale data helpers', () => {
  it('calculates sale totals from item quantity and unit price', () => {
    expect(
      getSaleTotal({
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            unitPrice: 15,
            kitId: null,
            product: {
              id: 'product-1',
              name: 'Bolo',
              unit: 'un',
              status: 'active',
            },
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 3,
            unitPrice: 10,
            kitId: null,
            product: {
              id: 'product-2',
              name: 'Doce',
              unit: 'un',
              status: 'active',
            },
          },
        ],
      })
    ).toBe(60)
  })

  it('formats currency for Brazilian Portuguese', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50')
  })

  it('keeps status and payment labels stable', () => {
    expect(saleStatusMap.completed).toEqual({
      label: 'Concluído',
      variant: 'success',
    })
    expect(paymentMethodMap.pix).toBe('Pix')
  })
})
