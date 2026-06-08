import puppeteer from 'puppeteer'
import { generateInvoiceHtml } from './invoice-template'

type InvoiceItem = {
	name: string
	unit: string
	quantity: number
	unitPrice: number
}

type InvoiceCompany = {
	name: string
	tradeName: string
	cnpj: string
	email: string
	phone: string
	logoUrl: string
	street: string
	number: string
	complement: string
	neighborhood: string
	city: string
	state: string
	website: string
	whatsapp: string
}

type InvoiceClient = {
	name: string
	phone: string
	street: string
	number: string
	complement: string
	neighborhood: string
	city: string
	state: string
}

type InvoiceData = {
	saleId: string
	status: string
	createdAt: string
	deliveryDate: string | null
	paymentMethod: string
	paidAt: string | null
	paymentNotes: string
	notes: string
	items: InvoiceItem[]
	company: InvoiceCompany
	client: InvoiceClient
}

let browserInstance: puppeteer.Browser | null = null

async function getBrowser(): Promise<puppeteer.Browser> {
	if (!browserInstance || !browserInstance.connected) {
		browserInstance = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-gpu',
			],
		})
	}
	return browserInstance
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
	const browser = await getBrowser()
	const page = await browser.newPage()

	try {
		const html = generateInvoiceHtml(data)
		await page.setContent(html, { waitUntil: 'networkidle0' })

		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: { top: '0', right: '0', bottom: '0', left: '0' },
		})

		return Buffer.from(pdfBuffer)
	} finally {
		await page.close()
	}
}
