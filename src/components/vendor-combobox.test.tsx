import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { VendorCombobox } from './vendor-combobox'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

function renderCombobox(
  props: Partial<React.ComponentProps<typeof VendorCombobox>> = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  function TestHarness() {
    const [value, setValue] = useState(props.value ?? '')
    return (
      <VendorCombobox
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
    'input[placeholder="Buscar fornecedor..."]'
  )!
}

function getComboboxButton() {
  return document.querySelector<HTMLButtonElement>('button[role="combobox"]')!
}

describe('VendorCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({
      data: {
        vendors: [
          {
            id: 'vendor-1',
            name: 'Fornecedor Bom',
            phone: '(11) 98888-7777',
            status: 'active',
          },
        ],
      },
    })
  })

  it('supports custom placeholder and does not fetch until the user types', async () => {
    const { getByRole, getByText } = await renderCombobox({
      placeholder: 'Escolha um fornecedor',
    })

    expect(getComboboxButton().textContent).toContain('Escolha um fornecedor')

    await userEvent.click(getByRole('combobox'))
    await expect.element(getByText('Digite para buscar.')).toBeInTheDocument()
    expect(apiGet).not.toHaveBeenCalled()
  })

  it('searches vendors with the expected params and selects a result', async () => {
    const onValueChange = vi.fn()
    const onVendorChange = vi.fn()
    const { getByRole, getByText } = await renderCombobox({
      onValueChange,
      onVendorChange,
      status: 'all',
      limit: 8,
    })

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput(), 'forn')

    await vi.waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/vendors/search', {
        params: { q: 'forn', status: 'all', limit: 8 },
      })
    )

    await userEvent.click(getByText('Fornecedor Bom'))

    expect(onValueChange).toHaveBeenCalledWith('vendor-1')
    expect(onVendorChange).toHaveBeenCalledWith({
      id: 'vendor-1',
      name: 'Fornecedor Bom',
      phone: '(11) 98888-7777',
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
    apiGet.mockResolvedValueOnce({ data: { vendors: [] } })
    const { getByRole, getByText } = await renderCombobox()

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput(), 'vazio')

    await expect
      .element(getByText('Nenhum fornecedor encontrado.'))
      .toBeInTheDocument()
  })
})
