import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type ProductSupplySearchItem } from '@/components/product-supply-combobox'
import { ProductionsActionDialog } from './productions-action-dialog'

const apiPost = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())

const product: ProductSupplySearchItem = {
  id: 'product-1',
  name: 'Bolo de Chocolate',
  unit: 'un',
}

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

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries }),
  }
})

vi.mock('@/components/product-supply-combobox', () => ({
  ProductSupplyCombobox: ({
    onValueChange,
    onItemChange,
    selectedItem,
    placeholder,
  }: {
    onValueChange: (value: string) => void
    onItemChange?: (item: ProductSupplySearchItem | null) => void
    selectedItem?: ProductSupplySearchItem | null
    placeholder?: string
  }) => (
    <button
      type='button'
      onClick={() => {
        onValueChange(product.id)
        onItemChange?.(product)
      }}
    >
      {selectedItem?.name || placeholder || 'Selecionar produto'}
    </button>
  ),
}))

function renderDialog(
  props: Partial<React.ComponentProps<typeof ProductionsActionDialog>> = {}
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductionsActionDialog open onOpenChange={vi.fn()} {...props} />
    </QueryClientProvider>
  )
}

function quantityInput() {
  return document.querySelector<HTMLInputElement>('input[type="number"]')!
}

function textInput(placeholder: string) {
  return document.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`
  )!
}

function buttonByText(text: string) {
  return Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent === text
  )!
}

async function addProductItem(quantity = '4') {
  await userEvent.click(buttonByText('Selecione o produto'))
  await userEvent.clear(quantityInput())
  await userEvent.type(quantityInput(), quantity)
  await userEvent.click(buttonByText('Adicionar'))
}

describe('ProductionsActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiPost.mockResolvedValue({ data: { ok: true } })
  })

  it('requires at least one item before submitting', async () => {
    const { getByRole } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /^Criar Produção$/i }))

    expect(toastError).toHaveBeenCalledWith('Adicione pelo menos um item.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('creates productions with notes and item payload', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await renderDialog({
      onOpenChange,
    })

    await userEvent.type(textInput('Opcional'), 'Produzir encomenda')
    await addProductItem('4')
    await userEvent.click(getByRole('button', { name: /^Criar Produção$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith('/productions', {
      notes: 'Produzir encomenda',
      items: [{ productId: 'product-1', quantity: 4 }],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['productions'],
    })
    expect(toastSuccess).toHaveBeenCalledWith('Produção criada com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('blocks duplicated products before saving', async () => {
    await renderDialog()

    await addProductItem()
    await addProductItem()

    expect(toastError).toHaveBeenCalledWith('Este produto já foi adicionado.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('removes items before saving', async () => {
    const { getByRole } = await renderDialog()

    await addProductItem()
    await userEvent.click(document.querySelector('button.text-red-500')!)
    await userEvent.click(getByRole('button', { name: /^Criar Produção$/i }))

    expect(toastError).toHaveBeenCalledWith('Adicione pelo menos um item.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('shows API errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiPost.mockRejectedValue({
      response: { data: { error: 'Insumo insuficiente.' } },
    })
    const { getByRole } = await renderDialog({ onOpenChange })

    await addProductItem()
    await userEvent.click(getByRole('button', { name: /^Criar Produção$/i }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Insumo insuficiente.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
