import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { type ClientSearchItem } from '@/components/client-combobox'
import { type ProductSupplySearchItem } from '@/components/product-supply-combobox'
import { type Sale } from '../data/schema'
import { SalesActionDialog } from './sales-action-dialog'

const apiPost = vi.hoisted(() => vi.fn())
const apiPatch = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const salesState = vi.hoisted(() => ({ currentRow: null as Sale | null }))

const client: ClientSearchItem = {
  id: 'client-1',
  name: 'Cliente Bom',
  phone: '(11) 99999-8888',
  status: 'active',
}

const product: {
  id: string
  name: string
  unit: string
  status: 'active'
  salePrice: number
} = {
  id: 'product-1',
  name: 'Bolo de Chocolate',
  unit: 'un',
  status: 'active',
  salePrice: 42.5,
}

vi.mock('@/lib/api', () => ({
  default: {
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

vi.mock('./sales-provider', () => ({
  useSales: () => ({
    currentRow: salesState.currentRow,
  }),
}))

vi.mock('@/components/client-combobox', () => ({
  ClientCombobox: ({
    onValueChange,
    onClientChange,
    selectedClient,
  }: {
    onValueChange: (value: string) => void
    onClientChange?: (client: ClientSearchItem | null) => void
    selectedClient?: ClientSearchItem | null
  }) => (
    <button
      type='button'
      data-testid='client-combobox'
      onClick={() => {
        onValueChange(client.id)
        onClientChange?.(client)
      }}
    >
      {selectedClient?.name || 'Selecione o cliente'}
    </button>
  ),
}))

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
      data-testid='product-combobox'
      onClick={() => {
        onValueChange(product.id)
        onItemChange?.(product)
      }}
    >
      {selectedItem?.name || placeholder || 'Selecionar produto'}
    </button>
  ),
}))

vi.mock('@/components/kit-combobox', () => ({
  KitCombobox: () => <div data-testid='kit-combobox' />,
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
      data-testid='date-picker'
      onClick={() => onSelect(new Date(2026, 0, 15))}
    >
      {selected?.toISOString().slice(0, 10) || placeholder || 'Selecionar data'}
    </button>
  ),
}))

const sale: Sale = {
  id: 'sale-1',
  clientId: 'client-1',
  customer: 'Cliente Bom',
  status: 'in_preparation',
  notes: 'Venda antiga',
  paymentMethod: 'pix',
  paidAt: null,
  paymentNotes: '',
  reversalReason: '',
  reversedBy: null,
  reversedAt: null,
  deliveredAt: null,
  deliveryDate: '2026-01-10T12:00:00.000Z',
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  client,
  items: [
    {
      id: 'sale-item-1',
      productId: 'product-1',
      quantity: 2,
      unitPrice: 25,
      kitId: null,
      product,
    },
  ],
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof SalesActionDialog>> = {}
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SalesActionDialog open onOpenChange={vi.fn()} {...props} />
    </QueryClientProvider>
  )
}

function draftQuantityInput() {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="number"]')
  return inputs[0]
}

function draftPriceInput() {
  const inputs = document.querySelectorAll<HTMLInputElement>('input[type="number"]')
  return inputs[1]
}

function textInput(placeholder: string) {
  return document.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`
  )!
}

async function selectClientAndDate() {
  await userEvent.click(document.body.querySelector('[data-testid="client-combobox"]')!)
  await userEvent.click(document.body.querySelector('[data-testid="date-picker"]')!)
}

async function addSaleItem(quantity = '2', unitPrice = '30') {
  await userEvent.click(document.body.querySelector('[data-testid="product-combobox"]')!)
  await userEvent.clear(draftQuantityInput())
  await userEvent.type(draftQuantityInput(), quantity)
  await userEvent.clear(draftPriceInput())
  await userEvent.type(draftPriceInput(), unitPrice)
  await userEvent.click(Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Adicionar')!)
}

describe('SalesActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    salesState.currentRow = null
    apiPost.mockResolvedValue({ data: { ok: true } })
    apiPatch.mockResolvedValue({ data: { ok: true } })
  })

  it('requires a client before submitting', async () => {
    const { getByRole } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    expect(toastError).toHaveBeenCalledWith('Cliente é obrigatório.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('requires delivery date before submitting', async () => {
    const { getByRole, getByText } = await renderDialog()

    await userEvent.click(getByText('Selecione o cliente'))
    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    expect(toastError).toHaveBeenCalledWith('Data de entrega é obrigatória.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('requires at least one item before submitting', async () => {
    const { getByRole } = await renderDialog()

    await selectClientAndDate()
    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    expect(toastError).toHaveBeenCalledWith('Adicione pelo menos um item ou kit.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('blocks negative unit prices before adding items', async () => {
    const { getByText } = await renderDialog()

    await userEvent.click(document.body.querySelector('[data-testid="product-combobox"]')!)
    await userEvent.clear(draftPriceInput())
    await userEvent.type(draftPriceInput(), '-1')
    await userEvent.click(getByText('Adicionar'))

    expect(toastError).toHaveBeenCalledWith(
      'O preço unitário não pode ser negativo.'
    )
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('auto-fills the unit price with the suggested sale price on selection', async () => {
    await renderDialog()

    await userEvent.click(document.body.querySelector('[data-testid="product-combobox"]')!)

    expect(draftPriceInput().value).toBe('42.5')
  })

  it('rounds the suggested sale price to the nearest cent', async () => {
    product.salePrice = 16.46666666666667
    try {
      await renderDialog()

      await userEvent.click(document.body.querySelector('[data-testid="product-combobox"]')!)

      expect(draftPriceInput().value).toBe('16.47')
    } finally {
      product.salePrice = 42.5
    }
  })

  it('allows overriding the auto-filled suggested price', async () => {
    const { getByRole } = await renderDialog()

    await selectClientAndDate()
    await userEvent.click(document.body.querySelector('[data-testid="product-combobox"]')!)
    expect(draftPriceInput().value).toBe('42.5')
    await userEvent.clear(draftQuantityInput())
    await userEvent.type(draftQuantityInput(), '3')
    await userEvent.clear(draftPriceInput())
    await userEvent.type(draftPriceInput(), '99.9')
    await userEvent.click(Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Adicionar')!)
    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith('/sales', {
      clientId: 'client-1',
      notes: '',
      deliveryDate: '2026-01-15',
      items: [{ productId: 'product-1', quantity: 3, unitPrice: 99.9 }],
    })
  })

  it('creates sales with formatted delivery date and item payload', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await renderDialog({
      onOpenChange,
    })

    await selectClientAndDate()
    await userEvent.type(textInput('Opcional'), 'Entrega rápida')
    await addSaleItem('3', '35')
    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith('/sales', {
      clientId: 'client-1',
      notes: 'Entrega rápida',
      deliveryDate: '2026-01-15',
      items: [{ productId: 'product-1', quantity: 3, unitPrice: 35 }],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['sales'] })
    expect(toastSuccess).toHaveBeenCalledWith('Venda criada com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('updates sales with patch when editing', async () => {
    const onOpenChange = vi.fn()
    salesState.currentRow = sale
    const { getByRole } = await renderDialog({
      onOpenChange,
    })

    await userEvent.clear(textInput('Opcional'))
    await userEvent.type(textInput('Opcional'), 'Venda revisada')
    await userEvent.click(getByRole('button', { name: /^Salvar Alterações$/i }))

    await vi.waitFor(() => expect(apiPatch).toHaveBeenCalledOnce())
    expect(apiPatch).toHaveBeenCalledWith('/sales/sale-1', {
      clientId: 'client-1',
      notes: 'Venda revisada',
      deliveryDate: '2026-01-10',
      items: [{ productId: 'product-1', quantity: 2, unitPrice: 25 }],
    })
    expect(toastSuccess).toHaveBeenCalledWith('Venda atualizada com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows API errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiPost.mockRejectedValue({
      response: { data: { error: 'Produto sem estoque.' } },
    })
    const { getByRole } = await renderDialog({ onOpenChange })

    await selectClientAndDate()
    await addSaleItem()
    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Produto sem estoque.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('edits the quantity of an added item from the table and recalculates the total', async () => {
    const { getByRole, getByText } = await renderDialog()

    await selectClientAndDate()
    await addSaleItem('2', '30')

    const allNumberInputs = document.querySelectorAll<HTMLInputElement>('input[type="number"]')
    const rowQuantityInput = allNumberInputs[allNumberInputs.length - 1]
    expect(rowQuantityInput.value).toBe('2')
    expect(getByText('R$ 60,00')).toBeTruthy()

    await userEvent.clear(rowQuantityInput)
    await userEvent.type(rowQuantityInput, '5')
    expect(getByText('R$ 150,00')).toBeTruthy()

    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith('/sales', {
      clientId: 'client-1',
      notes: '',
      deliveryDate: '2026-01-15',
      items: [{ productId: 'product-1', quantity: 5, unitPrice: 30 }],
    })
  })

  it('blocks submit when an item has invalid quantity', async () => {
    const { getByRole } = await renderDialog()

    await selectClientAndDate()
    await addSaleItem('2', '30')

    const allNumberInputs = document.querySelectorAll<HTMLInputElement>('input[type="number"]')
    const rowQuantityInput = allNumberInputs[allNumberInputs.length - 1]
    await userEvent.clear(rowQuantityInput)

    await userEvent.click(getByRole('button', { name: /^Criar Venda$/i }))

    expect(toastError).toHaveBeenCalledWith(
      'A quantidade de cada item deve ser maior que zero.'
    )
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('renders stacked item cards on mobile and hides the table', async () => {
    await page.viewport(375, 720)
    try {
      await renderDialog()

      await selectClientAndDate()
      await addSaleItem('2', '30')

      const card = document.body.querySelector('.sm\\:hidden')
      expect(card).toBeTruthy()
      expect(card?.textContent).toContain('Bolo de Chocolate')
      expect(card?.textContent).toContain('60,00')
      const cardQuantityInput = card?.querySelector<HTMLInputElement>(
        'input[type="number"]'
      )
      expect(cardQuantityInput?.value).toBe('2')

      const tableContainer = document.body.querySelector(
        'table[data-slot="table"]'
      )
      const tableWrapper = tableContainer?.parentElement?.parentElement
      expect(tableWrapper?.className ?? '').toContain('hidden')
    } finally {
      await page.viewport(1280, 720)
    }
  })
})
