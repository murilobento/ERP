import { generateInvoiceHtml } from './invoice-template.js'

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

type BrowserLike = {
  connected: boolean
  newPage: () => Promise<{
    setContent: (html: string, options?: { waitUntil?: string }) => Promise<void>
    pdf: (options: {
      format: string
      printBackground: boolean
      margin: { top: string; right: string; bottom: string; left: string }
    }) => Promise<Uint8Array>
    close: () => Promise<void>
  }>
  close: () => Promise<void>
}

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
)

let localBrowser: BrowserLike | null = null

async function launchBrowser(): Promise<BrowserLike> {
  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')

    return puppeteer.default.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }) as unknown as BrowserLike
  }

  if (localBrowser?.connected) {
    return localBrowser
  }

  const puppeteer = await import('puppeteer')
  localBrowser = (await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })) as unknown as BrowserLike

  return localBrowser
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  const shouldCloseBrowser = isServerless

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
    await page.close().catch(() => undefined)
    if (shouldCloseBrowser) {
      await browser.close().catch(() => undefined)
    }
  }
}
