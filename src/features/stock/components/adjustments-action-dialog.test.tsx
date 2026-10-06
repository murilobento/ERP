import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type StockAdjustment } from '../data/schema'
import { AdjustmentsActionDialog } from './adjustments-action-dialog'

const adjustmentsState = vi.hoisted(() => ({
  currentRow: null as StockAdjustment | null,
}))

const runMutation = vi.hoisted(() => vi.fn())

vi.mock('./adjustments-provider', () => ({
  useAdjustments: () => ({ currentRow: adjustmentsState.currentRow }),
}))

vi.mock('@/lib/use-entity-mutation', () => ({
  useEntityMutation: () => ({ run: runMutation, isLoading: false }),
}))

vi.mock('@/components/product-supply-combobox', () => ({
  ProductSupplyCombobox: ({ placeholder }: { placeholder?: string }) => (
    <button type='button'>{placeholder}</button>
  ),
}))

const adjustment: StockAdjustment = {
  id: 'adjustment-1',
  status: 'pending',
  itemType: 'product',
  productId: 'product-1',
  supplyId: null,
  quantity: 7,
  reason: 'Acerto anterior',
  authorId: 'user-1',
  completedById: null,
  completedAt: null,
  reversedById: null,
  reversedAt: null,
  reversalReason: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  product: { id: 'product-1', name: 'Bolo' },
  supply: null,
  author: { id: 'user-1', firstName: 'Ana', lastName: 'Silva' },
  completedBy: null,
  reversedBy: null,
}

function renderDialog(mode: 'add' | 'edit' = 'add') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AdjustmentsActionDialog mode={mode} open onOpenChange={vi.fn()} />
    </QueryClientProvider>
  )
}

describe('AdjustmentsActionDialog', () => {
  beforeEach(() => {
    adjustmentsState.currentRow = null
    vi.clearAllMocks()
  })

  it('opens a new adjustment with blank values when a previous adjustment is selected', () => {
    adjustmentsState.currentRow = adjustment
    const { getByRole, getByText, getByPlaceholderText } = renderDialog()

    expect(getByText('Novo Acerto')).toBeInTheDocument()
    expect(getByRole('spinbutton').getAttribute('value')).toBe('1')
    expect(getByPlaceholderText('Informe o motivo do acerto...')).toHaveValue(
      ''
    )
    expect(getByText('Selecione o item')).toBeInTheDocument()
  })

  it('loads the selected adjustment when opened in edit mode', () => {
    adjustmentsState.currentRow = adjustment
    const { getByText, getByPlaceholderText } = renderDialog('edit')

    expect(getByText('Editar Acerto')).toBeInTheDocument()
    expect(getByPlaceholderText('Informe o motivo do acerto...')).toHaveValue(
      'Acerto anterior'
    )
  })
})
