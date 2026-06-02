import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { type Client } from '../data/schema'
import { ClientsActionDialog } from './clients-action-dialog'

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

const client: Client = {
  id: 'client-1',
  name: 'Cliente Antigo',
  phone: '(11) 98888-7777',
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderDialog(
  props: Partial<React.ComponentProps<typeof ClientsActionDialog>> = {}
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientsActionDialog open onOpenChange={vi.fn()} {...props} />
    </QueryClientProvider>
  )
}

describe('ClientsActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiPost.mockResolvedValue({ data: { ok: true } })
    apiPatch.mockResolvedValue({ data: { ok: true } })
  })

  it('validates required fields before submitting', async () => {
    const { getByRole, getByText } = await renderDialog()

    await userEvent.click(getByRole('button', { name: /salvar alterações/i }))

    await expect.element(getByText('Nome é obrigatório.')).toBeInTheDocument()
    await expect
      .element(getByText('Telefone é obrigatório.'))
      .toBeInTheDocument()
    expect(apiPost).not.toHaveBeenCalled()
  })

  it('creates clients with formatted phone and default active status', async () => {
    const onOpenChange = vi.fn()
    const { getByLabelText, getByRole } = await renderDialog({ onOpenChange })

    await userEvent.type(getByLabelText(/^Nome$/i), 'Cliente Novo')
    await userEvent.type(getByLabelText(/^Telefone$/i), '11999998888')
    await userEvent.click(getByRole('button', { name: /salvar alterações/i }))

    await vi.waitFor(() => expect(apiPost).toHaveBeenCalledOnce())
    expect(apiPost).toHaveBeenCalledWith(
      '/clients',
      expect.objectContaining({
        name: 'Cliente Novo',
        phone: '(11) 99999-8888',
        status: 'active',
      })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['clients'] })
    expect(toastSuccess).toHaveBeenCalledWith('Cliente criado com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('updates existing clients with patch', async () => {
    const onOpenChange = vi.fn()
    const { getByLabelText, getByRole } = await renderDialog({
      currentRow: client,
      onOpenChange,
    })

    const name = getByLabelText(/^Nome$/i)
    await userEvent.clear(name)
    await userEvent.type(name, 'Cliente Atualizado')
    await userEvent.click(getByRole('button', { name: /salvar alterações/i }))

    await vi.waitFor(() => expect(apiPatch).toHaveBeenCalledOnce())
    expect(apiPatch).toHaveBeenCalledWith(
      '/clients/client-1',
      expect.objectContaining({ name: 'Cliente Atualizado' })
    )
    expect(toastSuccess).toHaveBeenCalledWith('Cliente atualizado com sucesso.')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows API errors without closing the dialog', async () => {
    const onOpenChange = vi.fn()
    apiPost.mockRejectedValue({
      response: { data: { error: 'Telefone já cadastrado.' } },
    })
    const { getByLabelText, getByRole } = await renderDialog({ onOpenChange })

    await userEvent.type(getByLabelText(/^Nome$/i), 'Cliente Novo')
    await userEvent.type(getByLabelText(/^Telefone$/i), '11999998888')
    await userEvent.click(getByRole('button', { name: /salvar alterações/i }))

    await vi.waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Telefone já cadastrado.')
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
