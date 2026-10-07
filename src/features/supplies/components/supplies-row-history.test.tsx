import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type Row } from '@tanstack/react-table'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type SupplyWithStock } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { SuppliesDialogs } from './supplies-dialogs'
import { SuppliesProvider } from './supplies-provider'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

const supply: SupplyWithStock = {
  id: 'supply-1',
  name: 'Farinha',
  description: '',
  unit: 'kg',
  packageUnit: 'saco',
  packageQuantity: 5,
  costPrice: 2.1,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  stock: 10,
}

const historyResponse = {
  supply,
  purchases: [
    {
      id: 'purchase-1',
      supplier: 'Fornecedor Bom',
      status: 'completed',
      createdAt: '2026-01-02T12:00:00.000Z',
      completedAt: '2026-01-03T12:00:00.000Z',
      packages: 3,
      quantity: 15,
      packageCost: 10.5,
      unitPrice: 2.1,
      total: 31.5,
    },
  ],
  summary: { count: 1, totalSpent: 31.5, avgUnitPrice: 2.1 },
}

function renderRow() {
  const queryClient = new QueryClient()
  const row = { original: supply } as unknown as Row<SupplyWithStock>
  return render(
    <QueryClientProvider client={queryClient}>
      <SuppliesProvider>
        <DataTableRowActions row={row} />
        <SuppliesDialogs />
      </SuppliesProvider>
    </QueryClientProvider>
  )
}

describe('supplies row history entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({ data: historyResponse })
  })

  it('opens the history dialog from the actions menu', async () => {
    const { getByRole, getByText } = await renderRow()

    await userEvent.click(getByRole('button', { name: 'Abrir menu' }))
    await userEvent.click(
      getByRole('menuitem', { name: 'Histórico de compras' })
    )

    expect(getByText('Total gasto')).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/supplies/supply-1/purchases')
    )
    expect(getByText('Fornecedor Bom')).toBeInTheDocument()
  })
})
