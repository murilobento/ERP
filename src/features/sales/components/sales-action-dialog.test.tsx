import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
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

const product = {
  id: 'product-1',
  name: 'Bolo de Chocolate',
  unit: 'un',
  status: 'active',
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
      onClick={() => {
        onValueChange(product.id)
        onItemChange?.(product)
      }}
    >
      {selectedItem?.name || placeholder || 'Selecionar produto'}
    </button>
  ),
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
    <button type='button' onClick={() => onSelect(new Date(2026, 0, 15))}>
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

function numberInput(index: number) {
  return document.querySelectorAll<HTMLInputElement>('input[type="number"]')[
    index
  ]
}

function textInput(placeholder: string) {
  return document.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`
  )!
}

async function selectClientAndDate() {
  await userEvent.click(document.body.querySelector('button')!)
  await userEvent.click(document.body.querySelectorAll('button')[1])
}

async function addSaleItem(quantity = '2', unitPrice = '30') {
  await userEvent.click(document.body.querySelectorAll('button')[2])
  await userEvent.clear(numberInput(0))
  await userEvent.type(numberInput(0), quantity)
  await userEvent.clear(numberInput(1))
  await userEvent.type(numberInput(1), unitPrice)
  await userEvent.click(document.body.querySelectorAll('button')[3])
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

    expect(toastError).toHaveBeenCalledWith('Adicione pelo menos um item.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('blocks negative unit prices before adding items', async () => {
    const { getByText } = await renderDialog()

    await userEvent.click(document.body.querySelectorAll('button')[2])
    await userEvent.clear(numberInput(1))
    await userEvent.type(numberInput(1), '-1')
    await userEvent.click(getByText('Adicionar'))

    expect(toastError).toHaveBeenCalledWith(
      'O preço unitário não pode ser negativo.'
    )
    expect(apiPost).not.toHaveBeenCalled()
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
})
