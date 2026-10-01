import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { queryKeys } from '@/lib/query-keys'
import { type Purchase } from '../data/schema'
import { PurchasesDeleteDialog } from './purchases-delete-dialog'

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

const purchase: Purchase = {
  id: 'purchase-1',
  vendorId: 'vendor-1',
  supplier: 'Moinho Central',
  status: 'pending',
  notes: '',
  reversalReason: '',
  reversedBy: null,
  reversedAt: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  vendor: {
    id: 'vendor-1',
    name: 'Moinho Central',
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

describe('PurchasesDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('confirms with the supplier name and deletes the purchase', async () => {
    const onOpenChange = vi.fn()
    const queryClient = new QueryClient()
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const rendered = render(
      <QueryClientProvider client={queryClient}>
        <PurchasesDeleteDialog
          open
          onOpenChange={onOpenChange}
          currentRow={purchase}
        />
      </QueryClientProvider>
    )
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    await expect.element(confirm).toBeDisabled()

    await userEvent.type(confirmationInput(), 'Moinho Central')
    await userEvent.click(confirm)

    await vi.waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/purchases/purchase-1')
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.purchases,
    })
    expect(toastSuccess).toHaveBeenCalledWith('Compra excluída com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
