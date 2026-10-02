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

  it('saves the file using the name sent by the server', async () => {
    let downloaded: { name: string; href: string } | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloaded = { name: this.download, href: this.href }
    })

    apiGet.mockResolvedValue({
      data: new Blob(['%PDF-1.4']),
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

  // Sem isso, o toast cairia no "Algo deu errado!" genérico.
  it('reads the error message when the body arrives as a blob', async () => {
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

  it('keeps the original error when the body is not JSON', async () => {
    const error = blobError(
      502,
      new Blob(['<html>bad gateway</html>'], { type: 'text/html' })
    )
    apiGet.mockRejectedValue(error)

    await expect(downloadInvoice('sale-1')).rejects.toBe(error)
  })
})
