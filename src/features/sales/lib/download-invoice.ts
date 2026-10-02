import api from '@/lib/api'

type ErrorWithResponse = {
  response?: { data?: unknown }
}

/**
 * A requisição pede `responseType: 'blob'`, então um erro 4xx/5xx também chega
 * como Blob — `handleServerError` não conseguiria ler o `{ error }` e cairia no
 * "Algo deu errado!". Reescrevemos o corpo pelo JSON para a mensagem real chegar
 * ao toast.
 */
async function withReadableError(error: unknown): Promise<unknown> {
  const response = (error as ErrorWithResponse)?.response
  if (response && response.data instanceof Blob) {
    try {
      response.data = JSON.parse(await response.data.text())
    } catch {
      // corpo não é JSON (HTML de proxy, PDF truncado): mantém o erro original
    }
  }
  return error
}

export async function downloadInvoice(saleId: string, _customerName?: string) {
  let response
  try {
    response = await api.get(`/sales/${saleId}/invoice`, {
      responseType: 'blob',
    })
  } catch (error) {
    throw await withReadableError(error)
  }

  const contentDisposition = response.headers['content-disposition']
  let filename = `fatura-${saleId.slice(-8)}.pdf`
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^"]+)"?/)
    if (match) filename = match[1]
  }

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
