import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Product } from '../data/schema'
import { ProductsActionDialog } from './products-action-dialog'

const apiGet = vi.hoisted(() => vi.fn())
const apiPost = vi.hoisted(() => vi.fn())
const apiPatch = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
    post: apiPost,
    patch: apiPatch,
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  }
})

const product: Product = {
  id: 'product-1',
  name: 'Bolo Antigo',
  description: '',
  unit: 'un',
  margin: 20,
  status: 'active',
  categoryId: 'category-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  category: { id: 'category-1', name: 'Bolos' },
  composition: [],
  stock: 0,
  costPrice: 0,
  salePrice: 0,
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof ProductsActionDialog>> = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductsActionDialog open onOpenChange={vi.fn()} {...props} />
    </QueryClientProvider>
  )
}

async function selectCategory(
  getByRole: Awaited<ReturnType<typeof render>>['getByRole'],
  name: string
) {
  await userEvent.click(getByRole('combobox'))
  await userEvent.click(getByRole('option', { name }))
}

describe('ProductsActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({
      data: { categories: [{ id: 'category-1', name: 'Bolos' }] },
    })
    apiPost.mockResolvedValue({ data: { ok: true } })
    apiPatch.mockResolvedValue({ data: { ok: true } })
  })

  it('validates required fields before submitting', async () => {
    const { getByLabelText, getByRole, getByText } = await renderDialog()

    await userEvent.clear(getByLabelText(/^Unidade$/i))
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await expect.element(getByText('Nome é obrigatório.')).toBeInTheDocument()
    await expect
      .element(getByText('Unidade é obrigatória.'))
      .toBeInTheDocument()
    await expect
      .element(getByText('Categoria é obrigatória.'))
      .toBeInTheDocument()
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('creates products with selected category and numeric margin', async () => {
    const onOpenChange = vi.fn()
    const { getByLabelText, getByRole } = await renderDialog({ onOpenChange })

    await vi.waitFor(() => expect(apiGet).toHaveBeenCalledWith('/categories'))
    await userEvent.type(getByLabelText(/^Nome$/i), 'Bolo de Chocolate')
    await userEvent.clear(getByLabelText(/^Unidade$/i))
    await userEvent.type(getByLabelText(/^Unidade$/i), 'un')
    await userEvent.clear(getByLabelText(/^Margem \(%\)$/i))
    await userEvent.type(getByLabelText(/^Margem \(%\)$/i), '35')
    await selectCategory(getByRole, 'Bolos')
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith(
      '/products',
      expect.objectContaining({
        name: 'Bolo de Chocolate',
        unit: 'un',
        margin: 35,
        categoryId: 'category-1',
        status: 'active',
      })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['products'] })
    expect(toastSuccess).toHaveBeenCalledWith('Produto criado com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('updates existing products with patch', async () => {
    const onOpenChange = vi.fn()
    const { getByLabelText, getByRole } = await renderDialog({
      currentRow: product,
      onOpenChange,
    })

    const name = getByLabelText(/^Nome$/i)
    await userEvent.clear(name)
    await userEvent.type(name, 'Bolo Atualizado')
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await vi.waitFor(() => expect(apiPatch).toHaveBeenCalledOnce())
    expect(apiPatch).toHaveBeenCalledWith(
      '/products/product-1',
      expect.objectContaining({ name: 'Bolo Atualizado' })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Produto atualizado com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows API errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiPost.mockRejectedValue({
      response: { data: { error: 'Produto duplicado.' } },
    })
    const { getByLabelText, getByRole } = await renderDialog({ onOpenChange })

    await vi.waitFor(() => expect(apiGet).toHaveBeenCalledWith('/categories'))
    await userEvent.type(getByLabelText(/^Nome$/i), 'Bolo de Chocolate')
    await selectCategory(getByRole, 'Bolos')
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Produto duplicado.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
