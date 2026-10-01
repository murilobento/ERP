import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { type Supply, type SupplyPurchaseHistory } from '../data/schema'
import { SuppliesHistoryDialog } from './supplies-history-dialog'

const apiGet = vi.hoisted(() => vi.fn())
const setOpen = vi.hoisted(() => vi.fn())
const setCurrentRow = vi.hoisted(() => vi.fn())
const suppliesState = vi.hoisted(() => ({
  open: 'history' as string | null,
  currentRow: null as Supply | null,
}))

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

vi.mock('./supplies-provider', () => ({
  useSupplies: () => ({
    open: suppliesState.open,
    setOpen,
    currentRow: suppliesState.currentRow,
    setCurrentRow,
  }),
}))

const supply: Supply = {
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
}

const history: SupplyPurchaseHistory = {
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

function renderDialog() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SuppliesHistoryDialog />
    </QueryClientProvider>
  )
}

function textOccurrences(fragment: string) {
  return Array.from(document.querySelectorAll('*')).filter(
    (el) =>
      el.children.length === 0 && (el.textContent ?? '').includes(fragment)
  ).length
}

describe('SuppliesHistoryDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    suppliesState.open = 'history'
    suppliesState.currentRow = supply
    apiGet.mockResolvedValue({ data: history })
  })

  it('loads the purchase history and shows summary and item values', async () => {
    const { getByText } = await renderDialog()

    await expect.element(getByText(/Farinha/)).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/supplies/supply-1/purchases')
    )

    // resumo: total gasto, compras concluídas, preço médio e custo atual
    await expect.element(getByText('Total gasto')).toBeInTheDocument()
    await expect
      .element(getByText('Compras concluídas', { exact: true }))
      .toBeInTheDocument()
    await expect.element(getByText('Preço médio')).toBeInTheDocument()
    await expect.element(getByText('Custo atual')).toBeInTheDocument()

    // detalhe da compra: fornecedor, quantidade, preço da embalagem e unitário
    await expect.element(getByText('Fornecedor Bom')).toBeInTheDocument()
    await expect.element(getByText(/3 saco\(s\) = 15 kg/)).toBeInTheDocument()
    await expect.element(getByText(/10,50\/saco/)).toBeInTheDocument()
    await expect.element(getByText(/Unit. R\$\s2,10\/kg/)).toBeInTheDocument()

    // o mesmo total aparece no resumo e na linha da compra
    expect(textOccurrences('31,50')).toBeGreaterThanOrEqual(2)
  })

  it('shows an empty state when the supply has no purchases', async () => {
    apiGet.mockResolvedValue({
      data: {
        ...history,
        purchases: [],
        summary: { count: 0, totalSpent: 0, avgUnitPrice: 0 },
      },
    })

    const { getByText } = await renderDialog()

    await expect
      .element(getByText('Nenhuma compra registrada para este insumo.'))
      .toBeInTheDocument()
  })
})
