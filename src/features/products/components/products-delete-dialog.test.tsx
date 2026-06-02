import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Product } from '../data/schema'
import { ProductsDeleteDialog } from './products-delete-dialog'

const apiDelete = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    delete: apiDelete,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}))

const product: Product = {
  id: 'product-1',
  name: 'Bolo de Chocolate',
  description: '',
  unit: 'un',
  margin: 25,
  status: 'active',
  categoryId: 'category-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  category: { id: 'category-1', name: 'Bolos' },
  composition: [],
  stock: 3,
  costPrice: 12,
  salePrice: 20,
}

function confirmationInput() {
  return document.querySelector<HTMLInputElement>(
    'input[placeholder="Digite o nome para confirmar a exclusão."]'
  )!
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof ProductsDeleteDialog>> = {}
) {
  const queryClient = new QueryClient()
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <ProductsDeleteDialog
        open
        onOpenChange={vi.fn()}
        currentRow={product}
        {...props}
      />
    </QueryClientProvider>
  )

  return { rendered, invalidateQueries }
}

describe('ProductsDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiDelete.mockResolvedValue({ data: { ok: true } })
  })

  it('keeps delete disabled until the product name matches', async () => {
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    await expect.element(confirm).toBeDisabled()

    await userEvent.type(confirmationInput(), 'Outro Produto')
    await expect.element(confirm).toBeDisabled()
  })

  it('deletes the product and invalidates the products query', async () => {
    const onOpenChange = vi.fn()
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'Bolo de Chocolate')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(apiDelete).toHaveBeenCalledWith('/products/product-1')
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] })
    expect(toastSuccess).toHaveBeenCalledWith('Produto excluído com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows backend errors and keeps the dialog open', async () => {
    const onOpenChange = vi.fn()
    apiDelete.mockRejectedValueOnce({
      response: { data: { error: 'Produto vinculado a vendas.' } },
    })
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

    await userEvent.type(confirmationInput(), 'Bolo de Chocolate')
    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Produto vinculado a vendas.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
