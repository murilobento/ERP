import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Sale } from '../data/schema'
import { SalesKanbanActionDialog } from './sales-kanban-action-dialog'

const apiPost = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const salesState = vi.hoisted(() => ({
  kanbanAction: null as { sale: Sale; targetStatus: Sale['status'] } | null,
  setKanbanAction: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: {
    post: apiPost,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}))

vi.mock('./sales-provider', () => ({
  useSales: () => salesState,
}))

vi.mock('@/components/date-picker', () => ({
  DatePicker: ({
    selected,
    onSelect,
    placeholder,
  }: {
    selected?: Date
    onSelect: (date: Date) => void
    placeholder?: string
  }) => (
    <button
      type='button'
      onClick={() => onSelect(new Date(2026, 0, 15, 10, 30))}
    >
      {selected?.toISOString() || placeholder || 'Selecione a data'}
    </button>
  ),
}))

const saleBase: Sale = {
  id: 'sale-1',
  clientId: 'client-1',
  customer: 'Cliente Bom',
  status: 'ready_for_delivery',
  notes: '',
  paymentMethod: '',
  paidAt: null,
  paymentNotes: '',
  reversalReason: '',
  reversedBy: null,
  reversedAt: null,
  deliveredAt: null,
  deliveryDate: '2026-01-20T12:00:00.000Z',
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: {
    id: 'client-1',
    name: 'Cliente Bom',
    phone: '(11) 99999-8888',
    status: 'active',
  },
  items: [
    {
      id: 'sale-item-1',
      productId: 'product-1',
      quantity: 2,
      unitPrice: 25,
      kitId: null,
      product: {
        id: 'product-1',
        name: 'Bolo de Chocolate',
        unit: 'un',
        status: 'active',
      },
    },
  ],
}

function selectTrigger() {
  return document.querySelector<HTMLElement>('[role="combobox"]')!
}

function renderDialog() {
  const queryClient = new QueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const setQueryData = vi.spyOn(queryClient, 'setQueryData')
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <SalesKanbanActionDialog />
    </QueryClientProvider>
  )

  return { rendered, invalidateQueries, setQueryData }
}

describe('SalesKanbanActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    salesState.kanbanAction = null
    apiPost.mockResolvedValue({ data: { sale: saleBase } })
  })

  it('moves ready-for-delivery sales to delivered and refreshes stock queries', async () => {
    salesState.kanbanAction = {
      sale: saleBase,
      targetStatus: 'delivered',
    }
    const { rendered, invalidateQueries, setQueryData } = renderDialog()
    const { getByRole } = await rendered

    await userEvent.click(getByRole('button', { name: 'Confirmar Entrega' }))

    await vi.waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/sales/sale-1/deliver', undefined)
    )
    expect(setQueryData).toHaveBeenCalled()
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['sales'] })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['sale', 'sale-1'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stock-balances'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stock-movements'],
    })
    expect(toastSuccess).toHaveBeenCalledWith('Venda movida para entregue.')
    expect(salesState.setKanbanAction).toHaveBeenCalledWith(null)
  })

  it('requires payment data before completing the sale, then submits payment', async () => {
    salesState.kanbanAction = {
      sale: { ...saleBase, status: 'delivered' },
      targetStatus: 'completed',
    }
    const { rendered, invalidateQueries } = renderDialog()
    const { getByRole } = await rendered

    await userEvent.click(getByRole('button', { name: 'Confirmar Conclusão' }))
    expect(toastError).toHaveBeenCalledWith(
      'Informe a forma e a data do pagamento.'
    )
    expect(apiPost).not.toHaveBeenCalled()

    await userEvent.click(selectTrigger())
    await userEvent.click(getByRole('option', { name: 'Pix' }))
    await userEvent.click(
      getByRole('button', { name: /2026-|Selecione a data/i })
    )
    await userEvent.type(
      document.querySelector<HTMLInputElement>(
        'input[placeholder="Opcional"]'
      )!,
      'Pago na entrega'
    )
    await userEvent.click(getByRole('button', { name: 'Confirmar Conclusão' }))

    await vi.waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/sales/sale-1/complete', {
        paymentMethod: 'pix',
        paidAt: expect.any(String),
        paymentNotes: 'Pago na entrega',
      })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['sales'] })
    expect(toastSuccess).toHaveBeenCalledWith('Venda movida para concluído.')
  })

  it('requires a reverse reason before reversing and refreshes stock queries', async () => {
    salesState.kanbanAction = {
      sale: { ...saleBase, status: 'completed' },
      targetStatus: 'in_preparation',
    }
    const { rendered, invalidateQueries } = renderDialog()
    const { getByRole } = await rendered

    await userEvent.click(getByRole('button', { name: 'Confirmar Estorno' }))
    expect(toastError).toHaveBeenCalledWith('Informe o motivo do estorno.')
    expect(apiPost).not.toHaveBeenCalled()

    await userEvent.type(
      document.querySelector<HTMLInputElement>(
        'input[placeholder="Informe o motivo..."]'
      )!,
      'Cliente desistiu'
    )
    await userEvent.click(getByRole('button', { name: 'Confirmar Estorno' }))

    await vi.waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/sales/sale-1/reverse', {
        reason: 'Cliente desistiu',
      })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stock-balances'],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['stock-movements'],
    })
    expect(toastSuccess).toHaveBeenCalledWith('Venda movida para em preparo.')
  })

  it('shows backend errors without clearing the action', async () => {
    salesState.kanbanAction = {
      sale: saleBase,
      targetStatus: 'delivered',
    }
    apiPost.mockRejectedValueOnce({
      response: { data: { error: 'Estoque inconsistente.' } },
    })
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    await userEvent.click(getByRole('button', { name: 'Confirmar Entrega' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Estoque inconsistente.')
    )
    expect(salesState.setKanbanAction).not.toHaveBeenCalledWith(null)
  })
})
