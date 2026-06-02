import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ClientCombobox } from './client-combobox'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

function renderCombobox(
  props: Partial<React.ComponentProps<typeof ClientCombobox>> = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  function TestHarness() {
    const [value, setValue] = useState(props.value ?? '')
    return (
      <ClientCombobox
        value={value}
        onValueChange={(next) => {
          setValue(next)
          props.onValueChange?.(next)
        }}
        {...props}
      />
    )
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <TestHarness />
    </QueryClientProvider>
  )
}

function getSearchInput() {
  return document.querySelector<HTMLInputElement>(
    'input[placeholder="Buscar cliente..."]'
  )!
}

describe('ClientCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({
      data: {
        clients: [
          {
            id: 'client-1',
            name: 'Cliente Bom',
            phone: '(11) 99999-8888',
            status: 'active',
          },
        ],
      },
    })
  })

  it('opens without fetching and shows the initial prompt', async () => {
    const { getByRole, getByText } = await renderCombobox()

    await userEvent.click(getByRole('combobox'))

    await expect.element(getByText('Digite para buscar.')).toBeInTheDocument()
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('searches clients with the expected params and selects a result', async () => {
    const onValueChange = vi.fn()
    const onClientChange = vi.fn()
    const { getByRole, getByText } = await renderCombobox({
      onValueChange,
      onClientChange,
      status: 'all',
      limit: 5,
    })

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput(), 'cli')

    await vi.waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/clients/search', {
        params: { q: 'cli', status: 'all', limit: 5 },
      })
    )

    await userEvent.click(getByText('Cliente Bom'))

    expect(onValueChange).toHaveBeenCalledWith('client-1')
    expect(onClientChange).toHaveBeenCalledWith({
      id: 'client-1',
      name: 'Cliente Bom',
      phone: '(11) 99999-8888',
      status: 'active',
    })
  })

  it('shows the API error state', async () => {
    apiGet.mockRejectedValueOnce(new Error('network'))
    const { getByRole, getByText } = await renderCombobox()

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput(), 'erro')

    await expect.element(getByText('Falha ao buscar.')).toBeInTheDocument()
  })

  it('shows the empty state when there are no results', async () => {
    apiGet.mockResolvedValueOnce({ data: { clients: [] } })
    const { getByRole, getByText } = await renderCombobox()

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput(), 'ninguem')

    await expect
      .element(getByText('Nenhum cliente encontrado.'))
      .toBeInTheDocument()
  })
})
