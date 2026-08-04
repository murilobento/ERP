import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Supply } from '../data/schema'
import { SuppliesActionDialog } from './supplies-action-dialog'

const apiPost = vi.hoisted(() => vi.fn())
const apiPatch = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())
const toastError = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())

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

const supply: Supply = {
  id: 'supply-1',
  name: 'Farinha',
  description: '',
  unit: 'g',
  packageUnit: 'saco',
  packageQuantity: 5,
  costPrice: 10,
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof SuppliesActionDialog>> = {}
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SuppliesActionDialog open onOpenChange={vi.fn()} {...props} />
    </QueryClientProvider>
  )
}

describe('SuppliesActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiPost.mockResolvedValue({ data: { ok: true } })
    apiPatch.mockResolvedValue({ data: { ok: true } })
  })

  it('validates required fields before submitting', async () => {
    const { getByLabelText, getByRole, getByText } = await renderDialog()

    await userEvent.clear(getByLabelText(/^Nome$/i))
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await expect.element(getByText('Nome é obrigatório.')).toBeInTheDocument()
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('creates supplies with numeric package quantity and default status', async () => {
    const onOpenChange = vi.fn()
    const { getByLabelText, getByRole, getByText } = await renderDialog({
      onOpenChange,
    })

    await userEvent.type(getByLabelText(/^Nome$/i), 'Farinha')
    await userEvent.click(getByRole('combobox', { name: /^Unidade base$/i }))
    await userEvent.click(getByRole('option', { name: 'g' }))
    await userEvent.click(getByRole('combobox', { name: /^Embalagem$/i }))
    await userEvent.click(getByRole('option', { name: 'saco' }))
    await userEvent.clear(getByLabelText(/^Qtd por embalagem$/i))
    await userEvent.type(getByLabelText(/^Qtd por embalagem$/i), '5')

    await expect.element(getByText('1 embalagem = 5 g')).toBeInTheDocument()

    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith(
      '/supplies',
      expect.objectContaining({
        name: 'Farinha',
        unit: 'g',
        packageUnit: 'saco',
        packageQuantity: 5,
        status: 'active',
      })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['supplies'] })
    expect(toastSuccess).toHaveBeenCalledWith('Insumo criado com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('updates existing supplies with patch', async () => {
    const onOpenChange = vi.fn()
    const { getByLabelText, getByRole } = await renderDialog({
      currentRow: supply,
      onOpenChange,
    })

    const name = getByLabelText(/^Nome$/i)
    await userEvent.clear(name)
    await userEvent.type(name, 'Farinha Especial')
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await vi.waitFor(() => expect(apiPatch).toHaveBeenCalledOnce())
    expect(apiPatch).toHaveBeenCalledWith(
      '/supplies/supply-1',
      expect.objectContaining({ name: 'Farinha Especial' })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Insumo atualizado com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows API errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiPost.mockRejectedValue({
      response: { data: { error: 'Insumo duplicado.' } },
    })
    const { getByLabelText, getByRole } = await renderDialog({ onOpenChange })

    await userEvent.type(getByLabelText(/^Nome$/i), 'Farinha')
    await userEvent.click(getByRole('button', { name: /^Salvar$/i }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Insumo duplicado.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
