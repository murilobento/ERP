import api from '@/lib/api'

export async function downloadInvoice(saleId: string, _customerName?: string) {
	const response = await api.get(`/sales/${saleId}/invoice`, {
		responseType: 'blob',
	})

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
