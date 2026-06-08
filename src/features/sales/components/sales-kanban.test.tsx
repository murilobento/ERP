import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Sale } from '../data/schema'
import { SalesKanban } from './sales-kanban'

const apiGet = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const salesState = vi.hoisted(() => ({
  open: null as string | null,
  setOpen: vi.fn(),
  currentRow: null as Sale | null,
  setCurrentRow: vi.fn(),
  kanbanAction: null as { sale: Sale; targetStatus: Sale['status'] } | null,
  setKanbanAction: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}))

vi.mock('./sales-provider', () => ({
  useSales: () => salesState,
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}))

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    clientId: 'client-1',
    customer: 'Cliente Teste',
    status: 'in_preparation',
    notes: '',
    paymentMethod: '',
    paidAt: null,
    paymentNotes: '',
    reversalReason: '',
    reversedBy: null,
    reversedAt: null,
    deliveredAt: null,
    deliveryDate: '2026-06-03T12:00:00.000Z',
    completedAt: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    client: {
      id: 'client-1',
      name: 'Cliente Teste',
      phone: '(11) 99999-0000',
      status: 'active',
    },
    items: [],
    ...overrides,
  }
}

function renderKanban(data: Sale[], preparationSales: Sale[]) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SalesKanban data={data} preparationSales={preparationSales} />
    </QueryClientProvider>
  )
}

describe('SalesKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({
      data: {
        balances: [
          {
            type: 'product',
            id: 'product-1',
            name: 'Bolo de Chocolate',
            unit: 'un',
            stock: 17,
          },
          {
            type: 'product',
            id: 'product-2',
            name: 'Torta de Limão',
            unit: 'un',
            stock: 5,
          },
        ],
      },
    })
  })

  it('opens the preparation summary dialog via Info icon', async () => {
    const sale = makeSale()
    const rendered = await renderKanban([sale], [sale])

    const infoButton = rendered.getByRole('button', {
      name: 'Ver produtos em preparo',
    })
    await userEvent.click(infoButton)

    await vi.waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]')
      expect(dialog).toBeTruthy()
      expect(dialog?.textContent).toContain('Produtos em preparo')
    })
  })

  it('aggregates repeated products across orders with summed quantity and order count', async () => {
    const sale1 = makeSale({
      id: 'sale-1',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          unitPrice: 25,
          kitId: null,
          product: { id: 'product-1', name: 'Bolo de Chocolate', unit: 'un', status: 'active' },
        },
      ],
    })
    const sale2 = makeSale({
      id: 'sale-2',
      items: [
        {
          id: 'item-2',
          productId: 'product-1',
          quantity: 3,
          unitPrice: 25,
          kitId: null,
          product: { id: 'product-1', name: 'Bolo de Chocolate', unit: 'un', status: 'active' },
        },
        {
          id: 'item-3',
          productId: 'product-2',
          quantity: 1,
          unitPrice: 40,
          kitId: null,
          product: { id: 'product-2', name: 'Torta de Limão', unit: 'un', status: 'active' },
        },
      ],
    })

    const rendered = await renderKanban([sale1, sale2], [sale1, sale2])

    const infoButton = rendered.getByRole('button', {
      name: 'Ver produtos em preparo',
    })
    await userEvent.click(infoButton)

    await vi.waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]')!
      expect(dialog.textContent).toContain('6 itens')
      expect(dialog.textContent).toContain('2 pedidos em preparo')
    })

    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('5x')
    expect(dialog.textContent).toContain('Bolo de Chocolate')
    expect(dialog.textContent).toContain('(2 pedidos)')
    expect(dialog.textContent).toContain('1x')
    expect(dialog.textContent).toContain('Torta de Limão')
  })

  it('shows stock from /stock/balances as Est:', async () => {
    const sale = makeSale({
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 1,
          unitPrice: 25,
          kitId: null,
          product: { id: 'product-1', name: 'Bolo de Chocolate', unit: 'un', status: 'active' },
        },
      ],
    })

    const rendered = await renderKanban([sale], [sale])

    const infoButton = rendered.getByRole('button', {
      name: 'Ver produtos em preparo',
    })
    await userEvent.click(infoButton)

    await vi.waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith('/stock/balances')
    })

    await vi.waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]')!
      expect(dialog.textContent).toContain('Est: 17')
    })
  })

  it('shows empty state when no preparation sales exist', async () => {
    const rendered = await renderKanban([], [])

    const infoButton = rendered.getByRole('button', {
      name: 'Ver produtos em preparo',
    })
    await userEvent.click(infoButton)

    await vi.waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]')!
      expect(dialog.textContent).toContain(
        'Nenhum produto em preparo neste período.'
      )
    })
  })
})
