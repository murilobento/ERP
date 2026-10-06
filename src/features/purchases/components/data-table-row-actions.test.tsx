import { type Row } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Purchase } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const purchasesState = vi.hoisted(() => ({
  setOpen: vi.fn(),
  setCurrentRow: vi.fn(),
}))

vi.mock('./purchases-provider', () => ({
  usePurchases: () => purchasesState,
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ auth: { user: { role: 'manager' } } }),
}))

const basePurchase = {
  id: 'purchase-1',
  status: 'pending',
} as Purchase

async function clickAction(status: Purchase['status'], label: string) {
  const purchase = { ...basePurchase, status }
  const { getByRole } = render(
    <DataTableRowActions row={{ original: purchase } as Row<Purchase>} />
  )

  await userEvent.click(getByRole('button', { name: 'Abrir menu' }))
  await userEvent.click(getByRole('menuitem', { name: new RegExp(label) }))
  return purchase
}

describe('Purchases row actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['pending', 'Concluir', 'complete'],
    ['completed', 'Estornar', 'reverse'],
  ] as const)(
    'opens the %s purchase action from the row menu',
    async (status, label, action) => {
      const purchase = await clickAction(status, label)

      expect(purchasesState.setCurrentRow).toHaveBeenCalledWith(purchase)
      expect(purchasesState.setOpen).toHaveBeenCalledWith(action)
    }
  )
})
