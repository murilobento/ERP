import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKeys } from '@/lib/query-keys'
import { type Sale } from '../data/schema'
import { SalesDeleteDialog } from './sales-delete-dialog'

const apiDelete = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    delete: apiDelete,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: vi.fn(),
  },
}))

const sale: Sale = {
  id: 'sale-1',
  clientId: 'client-1',
  customer: 'Padaria Sol',
  status: 'in_preparation',
  notes: '',
  paymentMethod: '',
  paidAt: null,
  paymentNotes: '',
  reversalReason: '',
  reversedBy: null,
  reversedAt: null,
  deliveredAt: null,
  deliveryDate: '2026-06-10',
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client: {
    id: 'client-1',
    name: 'Padaria Sol',
    phone: '',
    status: 'active',
  },
  items: [],
}

function confirmationInput() {
  return document.querySelector<HTMLInputElement>(
    'input[placeholder="Digite o nome para confirmar a exclusão."]'
  )!
}

describe('SalesDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('confirms with the customer name and deletes the sale', async () => {
    const onOpenChange = vi.fn()
    const queryClient = new QueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <SalesDeleteDialog open onOpenChange={onOpenChange} currentRow={sale} />
      </QueryClientProvider>
    )
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    expect(confirm).toBeDisabled()

    await userEvent.type(confirmationInput(), 'Padaria Sol')
    await userEvent.click(confirm)

    await vi.waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/sales/sale-1')
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.sales,
    })
    expect(toastSuccess).toHaveBeenCalledWith('Venda excluída com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
