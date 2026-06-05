import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type ProductSupplySearchItem } from '@/components/product-supply-combobox'
import { type VendorSearchItem } from '@/components/vendor-combobox'
import { type Purchase } from '../data/schema'
import { PurchasesActionDialog } from './purchases-action-dialog'

const apiPost = vi.hoisted(() => vi.fn())
const apiPatch = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const purchasesState = vi.hoisted(() => ({
  currentRow: null as Purchase | null,
}))

const vendor = {
  id: 'vendor-1',
  name: 'Fornecedor Bom',
  phone: '(11) 98888-7777',
  status: 'active',
}

const supply: ProductSupplySearchItem = {
  id: 'supply-1',
  name: 'Farinha',
  unit: 'kg',
  packageUnit: 'saco',
  packageQuantity: 5,
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

vi.mock('./purchases-provider', () => ({
  usePurchases: () => ({
    currentRow: purchasesState.currentRow,
  }),
}))

vi.mock('@/components/vendor-combobox', () => ({
  VendorCombobox: ({
    onValueChange,
    onVendorChange,
    placeholder,
    selectedVendor,
  }: {
    onValueChange: (value: string) => void
    onVendorChange?: (vendor: VendorSearchItem | null) => void
    placeholder?: string
    selectedVendor?: VendorSearchItem | null
  }) => (
    <button
      type='button'
      onClick={() => {
        onValueChange(vendor.id)
        onVendorChange?.(vendor)
      }}
    >
      {selectedVendor?.name || placeholder || 'Selecionar fornecedor'}
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
        onValueChange(supply.id)
        onItemChange?.(supply)
      }}
    >
      {selectedItem?.name || placeholder || 'Selecionar insumo'}
    </button>
  ),
}))

const purchase: Purchase = {
  id: 'purchase-1',
  vendorId: 'vendor-1',
  supplier: 'Fornecedor Bom',
  status: 'pending',
  notes: 'Compra antiga',
  reversalReason: '',
  reversedBy: null,
  reversedAt: null,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  vendor,
  items: [
    {
      id: 'purchase-item-1',
      purchaseId: 'purchase-1',
      supplyId: 'supply-1',
      packages: 2,
      quantity: 10,
      packageCost: 12,
      supply: {
        id: 'supply-1',
        name: 'Farinha',
        unit: 'kg',
        packageUnit: 'saco',
        packageQuantity: 5,
      },
    },
  ],
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof PurchasesActionDialog>> = {}
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <PurchasesActionDialog open onOpenChange={vi.fn()} {...props} />
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

function buttonByText(text: string) {
  return Array.from(document.querySelectorAll('button')).find(
    (button) => button.textContent === text
  )!
}

async function addSupplyItem() {
  await userEvent.click(buttonByText('Selecione...'))
  await userEvent.clear(numberInput(0))
  await userEvent.type(numberInput(0), '3')
  await userEvent.clear(numberInput(1))
  await userEvent.type(numberInput(1), '10.5')
  await userEvent.click(buttonByText('Adicionar'))
}

describe('PurchasesActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    purchasesState.currentRow = null
    apiPost.mockResolvedValue({ data: { ok: true } })
    apiPatch.mockResolvedValue({ data: { ok: true } })
  })

  it('requires a vendor before submitting', async () => {
    const { getByRole } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /^Criar Compra$/i }))

    expect(toastError).toHaveBeenCalledWith('Fornecedor é obrigatório.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('requires at least one item before submitting', async () => {
    const { getByRole, getByText } = await renderDialog()

    await userEvent.click(getByText('Selecione o fornecedor'))
    await userEvent.click(getByRole('button', { name: /^Criar Compra$/i }))

    expect(toastError).toHaveBeenCalledWith('Adicione pelo menos um item.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('creates purchases with selected vendor, notes and item payload', async () => {
    const onOpenChange = vi.fn()
    const { getByRole, getByText } = await renderDialog({
      onOpenChange,
    })

    await userEvent.click(getByText('Selecione o fornecedor'))
    await userEvent.type(textInput('Opcional'), 'Reposição semanal')
    await addSupplyItem()
    await userEvent.click(getByRole('button', { name: /^Criar Compra$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith('/purchases', {
      vendorId: 'vendor-1',
      notes: 'Reposição semanal',
      items: [{ supplyId: 'supply-1', packages: 3, packageCost: 10.5 }],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['purchases'] })
    expect(toastSuccess).toHaveBeenCalledWith('Compra criada com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('blocks duplicated supplies before saving', async () => {
    await renderDialog()

    await addSupplyItem()
    await addSupplyItem()

    expect(toastError).toHaveBeenCalledWith('Este insumo já foi adicionado.')
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('updates purchases with patch when editing', async () => {
    const onOpenChange = vi.fn()
    purchasesState.currentRow = purchase
    const { getByRole, getByText } = await renderDialog({
      onOpenChange,
    })

    await userEvent.click(getByText('Selecione o fornecedor'))
    await userEvent.clear(textInput('Opcional'))
    await userEvent.type(textInput('Opcional'), 'Compra revisada')
    await addSupplyItem()
    await userEvent.click(getByRole('button', { name: /^Salvar Alterações$/i }))

    await vi.waitFor(() => expect(apiPatch).toHaveBeenCalledOnce())
    expect(apiPatch).toHaveBeenCalledWith('/purchases/purchase-1', {
      vendorId: 'vendor-1',
      notes: 'Compra revisada',
      items: [{ supplyId: 'supply-1', packages: 3, packageCost: 10.5 }],
    })
    expect(toastSuccess).toHaveBeenCalledWith('Compra atualizada com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows API errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiPost.mockRejectedValue({
      response: { data: { error: 'Estoque indisponível.' } },
    })
    const { getByRole, getByText } = await renderDialog({ onOpenChange })

    await userEvent.click(getByText('Selecione o fornecedor'))
    await addSupplyItem()
    await userEvent.click(getByRole('button', { name: /^Criar Compra$/i }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Estoque indisponível.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('updates the quantity of an added item from the table and recalculates the total', async () => {
    const { getByRole, getByText } = await renderDialog()

    await userEvent.click(buttonByText('Selecione o fornecedor'))
    await addSupplyItem()
    const rowQuantityInput = numberInput(2)
    expect(rowQuantityInput.value).toBe('3')
    expect(getByText('15')).toBeTruthy()

    await userEvent.clear(rowQuantityInput)
    await userEvent.type(rowQuantityInput, '5')
    expect(getByText('25')).toBeTruthy()

    await userEvent.click(getByRole('button', { name: /^Criar Compra$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith('/purchases', {
      vendorId: 'vendor-1',
      notes: '',
      items: [{ supplyId: 'supply-1', packages: 5, packageCost: 10.5 }],
    })
  })

  it('blocks submit when an item has invalid quantity', async () => {
    const { getByRole } = await renderDialog()

    await userEvent.click(buttonByText('Selecione o fornecedor'))
    await addSupplyItem()
    const rowQuantityInput = numberInput(2)
    await userEvent.clear(rowQuantityInput)

    await userEvent.click(getByRole('button', { name: /^Criar Compra$/i }))

    expect(toastError).toHaveBeenCalledWith(
      'A quantidade de cada item deve ser maior que zero.'
    )
    expect(apiPost).not.toHaveBeenCalled()
  })
})
