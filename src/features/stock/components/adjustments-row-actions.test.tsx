import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type StockAdjustment } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

const adjustmentsState = vi.hoisted(() => ({
  setOpen: vi.fn(),
  setCurrentRow: vi.fn(),
}))

vi.mock('./adjustments-provider', () => ({
  useAdjustments: () => adjustmentsState,
}))

const baseAdjustment = {
  id: 'adjustment-1',
  status: 'pending',
} as StockAdjustment

async function clickAction(status: StockAdjustment['status'], label: string) {
  const adjustment = { ...baseAdjustment, status }
  const queryClient = new QueryClient()
  const { getByRole } = render(
    <QueryClientProvider client={queryClient}>
      <DataTableRowActions
        row={{ original: adjustment } as Row<StockAdjustment>}
      />
    </QueryClientProvider>
  )

  await userEvent.click(getByRole('button', { name: 'Abrir menu' }))
  await userEvent.click(getByRole('menuitem', { name: new RegExp(label) }))
  return adjustment
}

describe('Stock adjustment row actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['pending', 'Concluir', 'complete'],
    ['completed', 'Estornar', 'reverse'],
  ] as const)(
    'opens the %s adjustment action from the row menu',
    async (status, label, action) => {
      const adjustment = await clickAction(status, label)

      expect(adjustmentsState.setCurrentRow).toHaveBeenCalledWith(adjustment)
      expect(adjustmentsState.setOpen).toHaveBeenCalledWith(action)
    }
  )
})
