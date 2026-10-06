import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  margin: 25,
  freightCost: 0,
  packagingCost: 0,
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

  it('confirms with a single button click, without typing the product name', async () => {
    const { rendered } = renderDialog()
    const { getByRole } = await rendered

    const confirm = getByRole('button', { name: 'Excluir' })
    expect(confirm).toBeEnabled()

    // nenhum campo de digitação para confirmar a exclusão
    expect(
      document.querySelector(
        'input[placeholder="Digite o nome para confirmar a exclusão."]'
      )
    ).toBeNull()
  })

  it('deletes the product and invalidates the products query', async () => {
    const onOpenChange = vi.fn()
    const { rendered, invalidateQueries } = renderDialog({ onOpenChange })
    const { getByRole } = await rendered

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

    await userEvent.click(getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Produto vinculado a vendas.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
