import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  expandConsumption,
  MOVEMENT_TYPE,
  movementParentEntity,
  recordProductionCompletion,
  recordSaleDelivery,
  StockLedgerError,
} from './stock'

type GroupByArgs = {
  by: Array<'productId' | 'supplyId'>
  where?: { productId?: { in: string[] }; supplyId?: { in: string[] } }
}

function createLedgerTx() {
  const balances = new Map<string, number>()
  const created: Array<Record<string, unknown>> = []

  const tx = {
    stockMovement: {
      groupBy: vi.fn(async (args: GroupByArgs) => {
        const key = args.by[0]
        const kind = key === 'productId' ? 'product' : 'supply'
        const ids = args.where?.[key]?.in ?? []
        return ids.map((id) => ({
          [key]: id,
          _sum: { quantity: balances.get(`${kind}:${id}`) ?? 0 },
        }))
      }),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => {
        created.push(args.data)
        return args
      }),
    },
  }

  return { tx, balances, created }
}

type LedgerTx = Parameters<typeof recordSaleDelivery>[0]

describe('movement vocabulary', () => {
  it('classifies every movement type to its parent entity', () => {
    expect(movementParentEntity(MOVEMENT_TYPE.SALE_DELIVERY)).toBe('sale')
    expect(movementParentEntity(MOVEMENT_TYPE.SALE_REVERSAL)).toBe('sale')
    expect(movementParentEntity(MOVEMENT_TYPE.PURCHASE)).toBe('purchase')
    expect(movementParentEntity(MOVEMENT_TYPE.PURCHASE_REVERSAL)).toBe('purchase')
    expect(movementParentEntity(MOVEMENT_TYPE.PRODUCTION_OUTPUT)).toBe('production')
    expect(movementParentEntity(MOVEMENT_TYPE.PRODUCTION_CONSUMPTION)).toBe('production')
    expect(movementParentEntity(MOVEMENT_TYPE.PRODUCTION_REVERSAL)).toBe('production')
    expect(movementParentEntity(MOVEMENT_TYPE.ADJUSTMENT)).toBe('adjustment')
    expect(movementParentEntity(MOVEMENT_TYPE.ADJUSTMENT_REVERSAL)).toBe('adjustment')
  })

  it('returns null for unknown types', () => {
    expect(movementParentEntity('unknown')).toBeNull()
  })
})

describe('recordSaleDelivery', () => {
  let setup: ReturnType<typeof createLedgerTx>

  beforeEach(() => {
    setup = createLedgerTx()
  })

  it('writes a negative movement with correct before/after', async () => {
    setup.balances.set('product:product-1', 10)

    await recordSaleDelivery(setup.tx as unknown as LedgerTx, {
      saleId: 'sale-1',
      customer: 'Cliente',
      authorId: 'user-1',
      items: [{ productId: 'product-1', quantity: 2, product: { name: 'Bolo', unit: 'un' } }],
    })

    expect(setup.created).toHaveLength(1)
    expect(setup.created[0]).toMatchObject({
      productId: 'product-1',
      quantity: -2,
      stockBefore: 10,
      stockAfter: 8,
      type: 'sale_delivery',
      referenceId: 'sale-1',
    })
  })

  it('rejects when product stock is insufficient', async () => {
    setup.balances.set('product:product-1', 2)

    await expect(
      recordSaleDelivery(setup.tx as unknown as LedgerTx, {
        saleId: 'sale-1',
        customer: 'Cliente',
        authorId: 'user-1',
        items: [{ productId: 'product-1', quantity: 5, product: { name: 'Bolo', unit: 'un' } }],
      })
    ).rejects.toBeInstanceOf(StockLedgerError)

    expect(setup.created).toHaveLength(0)
  })

  it('sequences before/after across movements on the same product (regression for stale stockBefore)', async () => {
    setup.balances.set('product:product-1', 10)

    await recordSaleDelivery(setup.tx as unknown as LedgerTx, {
      saleId: 'sale-1',
      customer: 'Cliente',
      authorId: 'user-1',
      items: [
        { productId: 'product-1', quantity: 3, product: { name: 'Bolo', unit: 'un' } },
        { productId: 'product-1', quantity: 3, product: { name: 'Bolo', unit: 'un' } },
      ],
    })

    expect(setup.created).toHaveLength(2)
    expect(setup.created[0]).toMatchObject({ stockBefore: 10, stockAfter: 7 })
    expect(setup.created[1]).toMatchObject({ stockBefore: 7, stockAfter: 4 })
  })
})

describe('recordProductionCompletion', () => {
  let setup: ReturnType<typeof createLedgerTx>

  beforeEach(() => {
    setup = createLedgerTx()
  })

  const items = [
    {
      productId: 'product-1',
      quantity: 3,
      product: {
        name: 'Bolo',
        unit: 'un',
        composition: [
          { supplyId: 'supply-1', quantity: 2, supply: { name: 'Farinha', unit: 'kg' } },
        ],
      },
    },
  ]

  it('writes the product output and the supply consumption', async () => {
    setup.balances.set('product:product-1', 5)
    setup.balances.set('supply:supply-1', 20)

    await recordProductionCompletion(setup.tx as unknown as LedgerTx, {
      productionId: 'production-1',
      authorId: 'user-1',
      items,
    })

    expect(setup.created).toHaveLength(2)
    expect(setup.created[0]).toMatchObject({
      productId: 'product-1',
      quantity: 3,
      stockBefore: 5,
      stockAfter: 8,
      type: 'production_output',
    })
    expect(setup.created[1]).toMatchObject({
      supplyId: 'supply-1',
      quantity: -6,
      stockBefore: 20,
      stockAfter: 14,
      type: 'production_consumption',
    })
  })

  it('rejects when an input supply is insufficient (regression for unchecked consumption)', async () => {
    setup.balances.set('product:product-1', 5)
    setup.balances.set('supply:supply-1', 1)

    await expect(
      recordProductionCompletion(setup.tx as unknown as LedgerTx, {
        productionId: 'production-1',
        authorId: 'user-1',
        items,
      })
    ).rejects.toThrow(/insumo/)

    expect(setup.created).toHaveLength(0)
  })
})

describe('expandConsumption', () => {
  it('sums consumption across items that share a supply', () => {
    const consumption = expandConsumption([
      {
        quantity: 3,
        product: {
          composition: [
            { supplyId: 'supply-1', quantity: 2, supply: { name: 'Farinha', unit: 'kg' } },
          ],
        },
      },
      {
        quantity: 1,
        product: {
          composition: [
            { supplyId: 'supply-1', quantity: 2, supply: { name: 'Farinha', unit: 'kg' } },
          ],
        },
      },
    ])

    expect(consumption.get('supply-1')?.quantity).toBe(8)
  })
})
