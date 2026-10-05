import { jsPDF } from 'jspdf'

type InvoiceItem = {
	name: string
	quantity: number
	unitPrice: number
}

type InvoiceCompany = {
	name: string
	tradeName: string
	cnpj: string
	email: string
	phone: string
	// Mantido no payload por compatibilidade com a API da fatura, mas não é
	// desenhado: a fatura é monocromática e não leva imagem nenhuma.
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

/**
 * Fatura em PDF de texto: sem browser, sem canvas. São algumas dezenas de
 * chamadas de `text`/`line` num documento de poucos KB, o que custa menos de um
 * milissegundo — e o texto continua selecionável e pesquisável, ao contrário de
 * uma rasterização.
 *
 * O jsPDF escreve com as fontes padrão em WinAnsi (Latin-1), que cobre o
 * português inteiro. Caractere fora desse conjunto viraria lixo no arquivo, então
 * é trocado por `?` em vez de deixar byte inválido vazar para o PDF.
 */

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN = 14
const RIGHT = PAGE_WIDTH - MARGIN
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN

const INK = '#111111'
const BODY = '#333333'
const MUTED = '#666666'
const FAINT = '#999999'
const RULE = '#ededed'

/** Colunas da tabela de itens, em milímetros. */
const COL_QTY = 130
const COL_PRICE = 166
const COL_NAME_WIDTH = 102

/** Ritmo vertical do documento. Faturas devem sair compactas. */
const LINE = 4.2
const GAP_SECTION = 6
const ROW_HEIGHT = 5.4

const CHAR_REPLACEMENTS: Record<string, string> = {
	'–': '-',
	'—': '-',
	'‘': "'",
	'’': "'",
	'“': '"',
	'”': '"',
	'•': '-',
	'\t': ' ',
}

/** Deixa passar só o que a WinAnsi sabe escrever. */
function toWinAnsi(value: string): string {
	let out = ''

	for (const char of value) {
		const mapped = CHAR_REPLACEMENTS[char]
		if (mapped !== undefined) {
			out += mapped
			continue
		}

		const code = char.codePointAt(0) ?? 0
		const printable =
			(code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff)
		out += printable ? char : '?'
	}

	return out
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	}).format(value)
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return '—'
	return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr))
}

function formatDateTime(dateStr: string | null): string {
	if (!dateStr) return '—'
	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(new Date(dateStr))
}

const statusLabels: Record<string, string> = {
	in_preparation: 'Em preparo',
	ready_for_delivery: 'Pronto para entrega',
	delivered: 'Entregue',
	completed: 'Concluída',
}

const paymentLabels: Record<string, string> = {
	pix: 'Pix',
	cash: 'Dinheiro',
	credit_card: 'Cartão de crédito',
	debit_card: 'Cartão de débito',
	bank_transfer: 'Transferência bancária',
	boleto: 'Boleto',
	other: 'Outro',
}

function buildAddress(c: {
	street: string
	number: string
	complement: string
	neighborhood: string
	city: string
	state: string
}): string {
	const parts = [
		c.street,
		c.number,
		c.complement,
		c.neighborhood,
		c.city,
		c.state,
	].filter(Boolean)
	return parts.join(', ')
}

type TextOptions = {
	size?: number
	bold?: boolean
	color?: string
	align?: 'left' | 'center' | 'right'
	width?: number
}

/**
 * Escreve uma linha. As coordenadas são milímetros medidos do topo da página,
 * que é a origem que o jsPDF adota no `text` e no `line` — não a de canto
 * inferior esquerdo do PDF cru, que é o que engana aqui.
 */
function write(
	doc: jsPDF,
	value: string,
	x: number,
	y: number,
	options: TextOptions = {},
): void {
	doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
	doc.setFontSize(options.size ?? 10)
	doc.setTextColor(options.color ?? BODY)
	doc.text(toWinAnsi(value), x, y, {
		align: options.align ?? 'left',
		maxWidth: options.width,
		lineHeightFactor: 1.2,
	})
}

/** Rótulo em caixa alta, o único elemento que sobrevive do layout antigo. */
function label(doc: jsPDF, value: string, x: number, y: number): void {
	write(doc, value.toUpperCase(), x, y, {
		size: 7.5,
		bold: true,
		color: FAINT,
	})
}

function rule(doc: jsPDF, y: number, color = RULE, weight = 0.2): void {
	doc.setDrawColor(color)
	doc.setLineWidth(weight)
	doc.line(MARGIN, y, RIGHT, y)
}

function drawTableHeader(doc: jsPDF, y: number): void {
	label(doc, 'Produto', MARGIN, y)
	write(doc, 'Qtd', COL_QTY, y, { size: 7.5, bold: true, color: FAINT, align: 'right' })
	write(doc, 'Preço unit.', COL_PRICE, y, { size: 7.5, bold: true, color: FAINT, align: 'right' })
	write(doc, 'Total', RIGHT, y, { size: 7.5, bold: true, color: FAINT, align: 'right' })

	rule(doc, y + 1.8, INK, 0.3)
}

function drawHeader(doc: jsPDF, data: InvoiceData): number {
	let y = MARGIN

	// Sem empresa cadastrada o bloco do emissor some inteiro, em vez de sobrar
	// um vão no canto esquerdo.
	if (data.company.name || data.company.tradeName) {
		if (data.company.name) {
			write(doc, data.company.name, MARGIN, y, { size: 13.5, bold: true, color: INK })
			y += 5.5
		}
		if (data.company.tradeName) {
			write(doc, data.company.tradeName, MARGIN, y, { size: 9.5, color: MUTED })
			y += 4.2
		}

		const address = buildAddress(data.company)
		const identity = [
			data.company.cnpj ? `CNPJ ${data.company.cnpj}` : '',
			address,
		]
			.filter(Boolean)
			.join(' · ')
		if (identity) {
			write(doc, identity, MARGIN, y, { size: 8, color: MUTED })
			y += 3.8
		}

		const contact = [data.company.email, data.company.phone]
			.filter(Boolean)
			.join(' · ')
		if (contact) {
			write(doc, contact, MARGIN, y, { size: 8, color: MUTED })
			y += 3.8
		}
	}

	const shortId = data.saleId.slice(-8).toUpperCase()
	write(doc, 'FATURA', RIGHT, MARGIN, { size: 18, bold: true, color: INK, align: 'right' })
	write(doc, `Nº ${shortId}`, RIGHT, MARGIN + 6.5, { size: 8.5, color: MUTED, align: 'right' })

	y = Math.max(y, MARGIN + 8) + 3.5
	rule(doc, y, INK, 0.4)
	return y + GAP_SECTION
}

function drawMeta(doc: jsPDF, data: InvoiceData, y: number): number {
	label(doc, 'Cliente', MARGIN, y)
	label(doc, 'Datas', 112, y)
	y += 4.6

	write(doc, data.client.name, MARGIN, y, { size: 11, bold: true, color: INK })
	y += 4.6

	const clientDetails = [data.client.phone, buildAddress(data.client)]
		.filter(Boolean)
		.join(' · ')
	if (clientDetails) {
		write(doc, clientDetails, MARGIN, y, { size: 8.5 })
		y += 3.8
	}

	const statusLabel = statusLabels[data.status] || data.status
	const dates: Array<[string, string]> = [
		['Emitida em', formatDateTime(data.createdAt)],
		['Status', statusLabel],
	]
	if (data.deliveryDate) dates.push(['Entrega', formatDate(data.deliveryDate)])
	if (data.paidAt) dates.push(['Pagamento', formatDateTime(data.paidAt)])

	let dateY = y
	for (const [key, value] of dates) {
		write(doc, key, 112, dateY, { size: 8.5, color: FAINT })
		write(doc, value, 142, dateY, { size: 8.5 })
		dateY += LINE
	}

	const bottom = Math.max(y, dateY)
	rule(doc, bottom + 2.5)
	return bottom + GAP_SECTION
}

function drawItems(doc: jsPDF, data: InvoiceData, startY: number): number {
	let y = startY

	label(doc, 'Itens', MARGIN, y)
	y += 4.6
	drawTableHeader(doc, y)
	y += 5.4

	doc.setFont('helvetica', 'bold')
	doc.setFontSize(10)

	for (const item of data.items) {
		const nameLines = doc.splitTextToSize(toWinAnsi(item.name), COL_NAME_WIDTH)
		const rowHeight = Math.max(ROW_HEIGHT, nameLines.length * 3.8)

		if (y + rowHeight > BOTTOM_LIMIT) {
			doc.addPage()
			y = MARGIN
			drawTableHeader(doc, y)
			y += 5.4
		}

		write(doc, item.name, MARGIN, y, {
			size: 10,
			bold: true,
			color: INK,
			width: COL_NAME_WIDTH,
		})
		write(doc, item.quantity.toLocaleString('pt-BR'), COL_QTY, y, {
			size: 10,
			color: MUTED,
			align: 'right',
		})
		write(doc, formatCurrency(item.unitPrice), COL_PRICE, y, {
			size: 10,
			align: 'right',
		})
		write(doc, formatCurrency(item.quantity * item.unitPrice), RIGHT, y, {
			size: 10,
			bold: true,
			color: INK,
			align: 'right',
		})

		y += rowHeight
		rule(doc, y - 1.2)
	}

	return y
}

function drawTotals(doc: jsPDF, total: number, startY: number): number {
	let y = startY + GAP_SECTION

	if (y + 26 > BOTTOM_LIMIT) {
		doc.addPage()
		y = MARGIN + 4
	}

	write(doc, 'Subtotal', 118, y, { size: 9.5, color: MUTED })
	write(doc, formatCurrency(total), RIGHT, y, { size: 9.5, align: 'right' })

	rule(doc, y + 3, INK, 0.3)

	write(doc, 'Total', 118, y + 8.5, { size: 13, bold: true, color: INK })
	write(doc, formatCurrency(total), RIGHT, y + 8.5, {
		size: 13,
		bold: true,
		color: INK,
		align: 'right',
	})

	return y + 14
}

/**
 * Blocos de texto livre (forma de pagamento, notas, observações). Vêm como lista
 * para que o chamador não fique acumulando `y` — e para que um bloco vazio
 * simplesmente não ocupe espaço.
 */
function drawBlocks(
	doc: jsPDF,
	blocks: Array<[string, string]>,
	startY: number,
): number {
	let y = startY

	for (const [title, value] of blocks) {
		if (!value) continue

		if (y + GAP_SECTION + 12 > BOTTOM_LIMIT) {
			doc.addPage()
			y = MARGIN
		}

		y += GAP_SECTION
		label(doc, title, MARGIN, y)
		write(doc, value, MARGIN, y + 4.2, { size: 9.5 })
		y += 8.5
	}

	return y
}

/**
 * O rodapé vem logo abaixo do conteúdo, e não no fim da página: uma fatura de
 * um item ficaria com dois dedos de papel em branco entre o total e o rodapé.
 */
function drawFooter(doc: jsPDF, data: InvoiceData, startY: number): void {
	const links = [
		data.company.website,
		data.company.email,
		data.company.whatsapp ? `WhatsApp: ${data.company.whatsapp}` : '',
	]
		.filter(Boolean)
		.join(' · ')

	if (!links) return

	rule(doc, startY + 3)
	write(doc, links, PAGE_WIDTH / 2, startY + 7, {
		size: 8,
		color: FAINT,
		align: 'center',
	})
}

/**
 * Monta o documento. Exportado para os testes poderem inspecionar páginas e
 * texto desenhado; `generateInvoicePdf` é a borda usada pela rota.
 */
export function buildInvoiceDocument(data: InvoiceData): jsPDF {
	const doc = new jsPDF({ unit: 'mm', format: 'a4' })
	const total = data.items.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0,
	)

	let y = drawHeader(doc, data)
	y = drawMeta(doc, data, y)
	y = drawItems(doc, data, y)
	y = drawTotals(doc, total, y)

	drawFooter(
		doc,
		data,
		drawBlocks(
			doc,
			[
				[
					'Forma de pagamento',
					paymentLabels[data.paymentMethod] || data.paymentMethod,
				],
				['Notas do pagamento', data.paymentNotes],
				['Observações', data.notes],
			],
			y,
		),
	)

	return doc
}

export function generateInvoicePdf(data: InvoiceData): Uint8Array {
	return new Uint8Array(buildInvoiceDocument(data).output('arraybuffer'))
}