import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

async function renderDialog() {
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
  return { ...(await rendered), invalidateQueries, onOpenChange }
}

describe('PurchasesDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('deletes with a simple yes/no confirmation, without typing the supplier name', async () => {
    const { getByRole, getByText, invalidateQueries, onOpenChange } =
      await renderDialog()

    const confirm = getByRole('button', { name: 'Excluir' })
    expect(confirm).toBeEnabled()

    // nenhum campo de digitação para confirmar a exclusão
    expect(
      document.querySelector(
        'input[placeholder="Digite o nome para confirmar a exclusão."]'
      )
    ).toBeNull()

    // o nome do fornecedor continua identificando o registro na pergunta
    expect(getByText(/Moinho Central/)).toBeInTheDocument()

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

  it('cancels without calling the api', async () => {
    const { getByRole, onOpenChange } = await renderDialog()

    await userEvent.click(getByRole('button', { name: 'Cancelar' }))

    expect(apiDelete).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
