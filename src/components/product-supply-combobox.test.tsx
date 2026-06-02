import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { ProductSupplyCombobox } from './product-supply-combobox'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

function renderCombobox(
  props: Partial<React.ComponentProps<typeof ProductSupplyCombobox>> = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  function TestHarness() {
    const [value, setValue] = useState(props.value ?? '')
    return (
      <ProductSupplyCombobox
        type='product'
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

function getSearchInput(placeholder: string) {
  return document.querySelector<HTMLInputElement>(
    `input[placeholder="${placeholder}"]`
  )!
}

function getComboboxButton() {
  return document.querySelector<HTMLButtonElement>('button[role="combobox"]')!
}

describe('ProductSupplyCombobox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiGet.mockResolvedValue({
      data: {
        products: [
          {
            id: 'product-1',
            name: 'Bolo de Chocolate',
            unit: 'un',
            status: 'active',
            stock: 12,
          },
        ],
        supplies: [
          {
            id: 'supply-1',
            name: 'Farinha',
            unit: 'kg',
            status: 'active',
            packageUnit: 'saco',
            packageQuantity: 5,
          },
        ],
      },
    })
  })

  it('searches products with includeStock, status and limit, then selects a result', async () => {
    const onValueChange = vi.fn()
    const onItemChange = vi.fn()
    const { getByRole, getByText } = await renderCombobox({
      onValueChange,
      onItemChange,
      includeStock: true,
      status: 'all',
      limit: 3,
    })

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput('Buscar produto...'), 'bolo')

    await vi.waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/products/search', {
        params: {
          q: 'bolo',
          status: 'all',
          includeStock: true,
          limit: 3,
        },
      })
    )

    await userEvent.click(getByText('Bolo de Chocolate'))

    expect(onValueChange).toHaveBeenCalledWith('product-1')
    expect(onItemChange).toHaveBeenCalledWith({
      id: 'product-1',
      name: 'Bolo de Chocolate',
      unit: 'un',
      status: 'active',
      stock: 12,
    })
  })

  it('searches supplies on the supply endpoint and shows a custom empty message', async () => {
    apiGet.mockResolvedValueOnce({ data: { supplies: [] } })
    const { getByRole, getByText } = await renderCombobox({
      type: 'supply',
      emptyMessage: 'Nada encontrado no estoque.',
    })

    await userEvent.click(getByRole('combobox'))
    await userEvent.type(getSearchInput('Buscar insumo...'), 'acucar')

    await vi.waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/supplies/search', {
        params: {
          q: 'acucar',
          status: 'active',
          includeStock: false,
          limit: 20,
        },
      })
    )

    await expect
      .element(getByText('Nada encontrado no estoque.'))
      .toBeInTheDocument()
  })

  it('shows the default prompt and error state', async () => {
    apiGet.mockRejectedValueOnce(new Error('network'))
    const { getByRole, getByText } = await renderCombobox({
      type: 'supply',
      value: '',
    })

    expect(getComboboxButton().textContent).toContain('Selecione o insumo')

    await userEvent.click(getByRole('combobox'))
    await expect.element(getByText('Digite para buscar.')).toBeInTheDocument()
    await userEvent.type(getSearchInput('Buscar insumo...'), 'erro')

    await expect.element(getByText('Falha ao buscar.')).toBeInTheDocument()
  })
})
