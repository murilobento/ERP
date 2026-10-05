import { describe, expect, it } from 'vitest'
import { buildInvoiceDocument, generateInvoicePdf } from './invoice-pdf.js'

const baseData = {
	saleId: 'venda-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
	status: 'completed',
	createdAt: '2026-01-02T14:00:00.000Z',
	deliveryDate: '2026-01-15T12:00:00.000Z',
	paymentMethod: 'pix',
	paidAt: '2026-01-03T10:00:00.000Z',
	paymentNotes: 'Pago na hora',
	notes: 'Entregar após as 14h',
	items: [{ name: 'Bolo de Chocolate', quantity: 2, unitPrice: 30 }],
	company: {
		name: 'Doces da Ana',
		tradeName: 'Aninha Doces',
		cnpj: '12345678000199',
		email: 'contato@doces.com.br',
		phone: '1144444444',
		logoUrl: 'https://cdn.test/logo.png',
		street: 'Rua B',
		number: '20',
		complement: '',
		neighborhood: 'Bela Vista',
		city: 'São Paulo',
		state: 'SP',
		website: 'doces.com.br',
		whatsapp: '11999999999',
	},
	client: {
		name: 'Cliente Uno',
		phone: '11999998888',
		street: 'Rua A',
		number: '10',
		complement: '',
		neighborhood: 'Centro',
		city: 'São Paulo',
		state: 'SP',
	},
}

function render(overrides: Record<string, unknown> = {}) {
	return buildInvoiceDocument({ ...baseData, ...overrides } as never)
}

function pdf(overrides: Record<string, unknown> = {}) {
	return Buffer.from(generateInvoicePdf({ ...baseData, ...overrides } as never))
}

/**
 * Extrai as strings que o PDF de fato desenha. Ler os operadores `Tj` é o que
 * prova que o texto virou conteúdo selecionável, e não imagem.
 */
function drawnTexts(bytes: Buffer): string[] {
	return [
		...(bytes
			.toString('latin1')
			.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)
			.map((match) =>
				// o PDF escapa parênteses e barra dentro das strings literais
				match[1]
					.replace(/\\([()\\])/g, '$1')
					// e `Intl` separa símbolo do número com espaço não separável
					.replace(/\u00a0/g, ' '),
			)),
	]
}

function drawn(overrides: Record<string, unknown> = {}): string {
	return drawnTexts(pdf(overrides)).join('\n')
}

const PAGE_HEIGHT_MM = 297
const MARGIN_MM = 14
const LEFT_COLUMN = 'left'
const RIGHT_COLUMN = 'right'
const toMm = (pt: number) => (pt / 72) * 25.4

type Placed = { text: string; x: number; y: number }

/**
 * Texto desenhado com a posição real, em milímetros do topo da página. É o que
 * pega eixo Y invertido: o stream do PDF guarda a coordenada de baixo para cima,
 * então ler o `Td` sem converter mostra o documento ao contrário.
 *
 * Linhas de continuação (que o jsPDF emite com `T*`, sem novo `Td`) ficam de
 * fora, o que não importa para checar ordem.
 */
function placed(overrides: Record<string, unknown> = {}): Placed[] {
	return [
		...(pdf(overrides)
			.toString('latin1')
			.matchAll(
				/([\d.]+) ([\d.]+) Td\n\(((?:[^()\\]|\\.)*)\)\s*Tj/g,
			)
			.map((match) => ({
				x: Math.round(toMm(Number(match[1]))),
				y: Math.round(PAGE_HEIGHT_MM - toMm(Number(match[2]))),
				text: match[3].replace(/\\([()\\])/g, '$1').replace(/\u00a0/g, ' '),
			}))),
	]
}

describe('generateInvoicePdf', () => {
	it('devolve um PDF válido', () => {
		expect(pdf().subarray(0, 5).toString()).toBe('%PDF-')
		expect(pdf().subarray(-6).toString()).toContain('EOF')
	})

	// O ponto do redesign: sem imagem, o texto do PDF continua selecionável.
	it('escreve texto, sem imagem incorporada', () => {
		const raw = pdf().toString('latin1')

		expect(raw).toMatch(/\) Tj/)
		expect(raw).not.toMatch(/\/Subtype\s*\/Image/)
		expect(raw).not.toMatch(/\/Filter\s*\/DCTDecode/)
	})

	it('mantém os acentos do português', () => {
		const texts = drawn({ items: [{ name: 'Ação ç ã é ê', quantity: 1, unitPrice: 1 }] })

		expect(texts).toContain('Ação ç ã é ê')
	})

	// WinAnsi não sabe escrever CJK/emoji: melhor um `?` legível que byte furado.
	it('troca por ? o que a fonte padrão não sabe escrever', () => {
		const texts = drawn({ client: { ...baseData.client, name: '日本 🍰 Ação' } })

		expect(texts).toContain('? ? Ação')
		expect(texts).not.toContain('日本')
	})

	it('converte travessões e aspas curvas em ASCII', () => {
		const texts = drawn({ notes: 'Entregar “amanhã” – das 14h às 18h' })

		expect(texts).toContain('Entregar "amanhã" - das 14h às 18h')
		expect(texts).not.toContain('–')
		expect(texts).not.toContain('“')
	})

	it('escreve cabeçalho, metas, itens, total e rodapé', () => {
		const texts = drawn()

		expect(texts).toContain('FATURA')
		expect(texts).toContain('Nº 3A4B5C6D')
		expect(texts).toContain('Doces da Ana')
		expect(texts).toContain('Cliente Uno')
		expect(texts).toContain('Bolo de Chocolate')
		expect(texts).toContain('Pix')
		expect(texts).toContain('doces.com.br')
		expect(texts).toContain('WhatsApp')
	})

	it('traduz status e forma de pagamento, com fallback para valor cru', () => {
		expect(drawn({ status: 'in_preparation' })).toContain('Em preparo')
		expect(drawn({ status: 'nao_existe' })).toContain('nao_existe')
		expect(drawn({ paymentMethod: 'boleto' })).toContain('Boleto')
	})

	it('totaliza os itens em BRL', () => {
		const texts = drawn({
			items: [
				{ name: 'Bolo', quantity: 2, unitPrice: 30 },
				{ name: 'Fubá', quantity: 1, unitPrice: 25 },
			],
		})

		// o total da venda aparece no subtotal e no total; cada linha traz a sua parte
		expect(texts.match(/R[$] 85,00/g)).toHaveLength(2)
		expect(texts).toContain('R$ 60,00')
		expect(texts).toContain('R$ 25,00')
	})

	// Regressão: o `y` do jsPDF já é medido do topo, e converter de novo
	// punha o cabeçalho embaixo e o rodapé em cima.
	it('desenha de cima para baixo, com o cabeçalho no topo', () => {
		const texts = placed()
		const ys = texts.map((item) => item.y)

		expect(texts[0].text).toBe('Doces da Ana')
		expect(texts[0].y).toBeLessThan(20)
		expect(texts.some((item) => item.text === 'FATURA' && item.y < 20)).toBe(true)
		// nada é desenhado acima da margem superior
		expect(Math.min(...ys)).toBeGreaterThanOrEqual(MARGIN_MM - 1)
		// dentro de cada coluna a ordem só desce (o cabeçalho tem duas colunas,
		// então o y global sobe quando a coluna da direita entra)
		for (const column of [LEFT_COLUMN, RIGHT_COLUMN]) {
			const columnYs = texts
				.filter((item) =>
					column === LEFT_COLUMN ? item.x <= 20 : item.x > 20,
				)
				.map((item) => item.y)
			expect(columnYs).toEqual([...columnYs].sort((a, b) => a - b))
		}
	})

	it('mantém o rodapé abaixo do último bloco, sem sobrepor', () => {
		const texts = placed()
		const lastBlock = texts.find((item) => item.text === 'Entregar após as 14h')
		const footer = texts.find((item) => item.text.includes('WhatsApp'))

		expect(lastBlock).toBeDefined()
		expect(footer).toBeDefined()
		expect(footer!.y).toBeGreaterThan(lastBlock!.y)
	})

	// Regressão: a fatura precisa sair curta, não espalhada pela página inteira.
	it('mantém uma fatura curta confinada ao topo da folha', () => {
		const texts = placed({
			items: [{ name: 'Brownie de Nutella', quantity: 1, unitPrice: 10 }],
			notes: '',
			paymentNotes: '',
		})
		const ys = texts.map((item) => item.y)

		expect(Math.min(...ys)).toBeLessThanOrEqual(PAGE_HEIGHT_MM)
		expect(Math.max(...ys)).toBeLessThan(160)
		// e o rodapé acompanha o conteúdo, sem pular para o fim do papel
		expect(
			texts.filter((item) => item.text === 'FATURA')[0].y,
		).toBeLessThan(Math.max(...ys))
	})

	it('cabe numa página para uma venda curta', () => {
		expect(render().getNumberOfPages()).toBe(1)
	})

	it('quebra em várias páginas e repete o cabeçalho da tabela', () => {
		const doc = render({
			items: Array.from({ length: 60 }, (_, index) => ({
				name: `Bolo nº ${index + 1}`,
				quantity: index + 1,
				unitPrice: 12.5,
			})),
		})

		expect(doc.getNumberOfPages()).toBeGreaterThan(1)
		expect(doc.getNumberOfPages()).toBeLessThanOrEqual(3)

		// o cabeçalho da tabela se repete em cada página que continua a lista
		const texts = drawnTexts(
			Buffer.from(doc.output('arraybuffer') as ArrayBuffer),
		)
		expect(texts.filter((text) => text === 'Preço unit.').length).toBeGreaterThanOrEqual(2)
	})

	it('quebra o nome longo em várias linhas, sem invadir a coluna de quantidade', () => {
		const name =
			'Bolo de Chocolate com brigadeiro de leite condensado e cobertura meio amarga especial da casa'
		const texts = drawnTexts(
			pdf({ items: [{ name, quantity: 1, unitPrice: 10 }] }),
		)

		// o nome foi partido em duas linhas, e não escrito inteiro em uma só
		expect(texts.some((text) => text.includes(name))).toBe(false)
		expect(
			texts.filter(
				(text) =>
					text.startsWith('Bolo de Chocolate') ||
					text.startsWith('cobertura meio amarga'),
			),
		).toEqual([
			'Bolo de Chocolate com brigadeiro de leite condensado e',
			'cobertura meio amarga especial da casa',
		])
	})

	it('omite blocos sem conteúdo em vez de escrever rótulo vazio', () => {
		const texts = drawn({ deliveryDate: null, paidAt: null, notes: '', paymentNotes: '' })

		expect(texts).not.toContain('Entrega')
		expect(texts).not.toContain('Pagamento')
		expect(texts).not.toContain('OBSERVAÇÕES')
		expect(texts).not.toContain('NOTAS DO PAGAMENTO')
		// a forma de pagamento permanece: sempre tem conteúdo
		expect(texts).toContain('FORMA DE PAGAMENTO')
		expect(texts).not.toContain('—')
	})

	it('funciona sem empresa cadastrada', () => {
		const texts = drawn({
			company: {
				...baseData.company,
				name: '',
				tradeName: '',
				cnpj: '',
				email: '',
				phone: '',
				logoUrl: '',
				street: '',
				number: '',
				neighborhood: '',
				city: '',
				state: '',
				website: '',
				whatsapp: '',
			},
		})

		expect(texts).not.toContain('CNPJ')
		expect(texts).not.toContain('doces.com.br')
		expect(texts).toContain('FATURA')
		expect(texts).toContain('Cliente Uno')
		expect(texts).toContain('Bolo de Chocolate')
	})

	it('não embute o logo, mesmo com logoUrl preenchido', () => {
		const texts = drawn()

		expect(texts).not.toContain('cdn.test')
		expect(pdf().toString('latin1')).not.toMatch(/\/Subtype\s*\/Image/)
	})
})