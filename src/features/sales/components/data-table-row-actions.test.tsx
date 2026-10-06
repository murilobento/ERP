import { type Row } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type Sale } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const salesState = vi.hoisted(() => ({
  setOpen: vi.fn(),
  setCurrentRow: vi.fn(),
}))

vi.mock('./sales-provider', () => ({
  useSales: () => salesState,
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ auth: { user: { role: 'manager' } } }),
}))

const baseSale = {
  id: 'sale-1',
  status: 'in_preparation',
} as Sale

async function clickAction(status: Sale['status'], label: string) {
  const sale = { ...baseSale, status }
  const { getByRole } = render(
    <DataTableRowActions row={{ original: sale } as Row<Sale>} />
  )

  await userEvent.click(getByRole('button', { name: 'Abrir menu' }))
  await userEvent.click(getByRole('menuitem', { name: new RegExp(label) }))
  return sale
}

describe('Sales row actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['in_preparation', 'Pronto para Entrega', 'ready-for-delivery'],
    ['ready_for_delivery', 'Entregar', 'deliver'],
    ['delivered', 'Concluir', 'complete'],
    ['completed', 'Estornar', 'reverse'],
  ] as const)(
    'opens the %s action from the row menu',
    async (status, label, action) => {
      const sale = await clickAction(status, label)

      expect(salesState.setCurrentRow).toHaveBeenCalledWith(sale)
      expect(salesState.setOpen).toHaveBeenCalledWith(action)
    }
  )
})
