import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadInvoice } from './download-invoice'

const apiGet = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  default: {
    get: apiGet,
  },
}))

function blobError(status: number, body: Blob) {
  return Object.assign(new Error('Request failed with status code ' + status), {
    isAxiosError: true,
    response: { status, data: body },
  })
}

describe('downloadInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('salva o PDF com o nome enviado pelo servidor', async () => {
    let downloaded: { name: string; href: string } | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloaded = { name: this.download, href: this.href }
    })

    apiGet.mockResolvedValue({
      data: new Blob(['%PDF-1.3']),
      headers: {
        'content-disposition': 'attachment; filename="fatura-SALE-1.pdf"',
      },
    })

    await downloadInvoice('sale-1')

    expect(apiGet).toHaveBeenCalledWith('/sales/sale-1/invoice', {
      responseType: 'blob',
    })
    expect(downloaded).toEqual({ name: 'fatura-SALE-1.pdf', href: 'blob:fake' })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })

  // A rota monta o nome a partir do id da venda; o cliente só precisa de um
  // nome razoável quando o servidor não manda o cabeçalho.
  it('usa o short id do sale quando não vem Content-Disposition', async () => {
    const clicks: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      clicks.push(this.download)
    })

    apiGet.mockResolvedValue({ data: new Blob(['%PDF-1.3']), headers: {} })

    await downloadInvoice('sale-abcdef12')

    expect(clicks).toEqual(['fatura-ABCDEF12.pdf'])
  })

  // Sem isso, o toast cairia no "Algo deu errado!" genérico.
  it('lê a mensagem de erro quando o corpo chega como blob', async () => {
    apiGet.mockRejectedValue(
      blobError(
        404,
        new Blob([JSON.stringify({ error: 'Venda não encontrada.' })], {
          type: 'application/json',
        })
      )
    )

    await expect(downloadInvoice('sale-1')).rejects.toMatchObject({
      response: { data: { error: 'Venda não encontrada.' } },
    })
  })

  it('mantém o erro original quando o corpo não é JSON', async () => {
    const error = blobError(
      502,
      new Blob(['<html>bad gateway</html>'], { type: 'text/html' })
    )
    apiGet.mockRejectedValue(error)

    await expect(downloadInvoice('sale-1')).rejects.toBe(error)
  })
})
