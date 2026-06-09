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

function getStatusColor(status: string): string {
	switch (status) {
		case 'completed':
			return '#16a34a'
		case 'delivered':
			return '#2563eb'
		case 'ready_for_delivery':
			return '#9333ea'
		default:
			return '#f59e0b'
	}
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function buildAddress(c: { street: string; number: string; complement: string; neighborhood: string; city: string; state: string }): string {
	const parts = [c.street, c.number, c.complement, c.neighborhood, c.city, c.state].filter(Boolean)
	return parts.join(', ')
}

export function generateInvoiceHtml(data: InvoiceData): string {
	const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
	const statusColor = getStatusColor(data.status)
	const statusLabel = statusLabels[data.status] || data.status
	const paymentLabel = paymentLabels[data.paymentMethod] || data.paymentMethod
	const companyAddress = escapeHtml(buildAddress(data.company))
	const clientAddress = escapeHtml(buildAddress(data.client))
	const shortId = data.saleId.slice(-8).toUpperCase()

	const e = escapeHtml

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    color: #1e293b;
    background: #fff;
    font-size: 13px;
    line-height: 1.5;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 16mm;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #0f172a;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .logo {
    width: 64px; height: 64px; border-radius: 12px;
    background: #f1f5f9; display: flex; align-items: center;
    justify-content: center; font-size: 24px; font-weight: 700;
    color: #0f172a; flex-shrink: 0; overflow: hidden;
  }
  .logo img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
  .company-info h1 { font-size: 20px; font-weight: 700; color: #0f172a; }
  .company-info .trade-name { font-size: 13px; color: #64748b; margin-bottom: 2px; }
  .company-info .details { font-size: 11px; color: #64748b; line-height: 1.6; }

  .header-right { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .invoice-id { font-size: 13px; color: #64748b; margin-top: 2px; }
  .status-badge {
    display: inline-block; margin-top: 8px; padding: 4px 14px;
    border-radius: 20px; font-size: 11px; font-weight: 600;
    color: #fff; background: ${statusColor};
  }

  .meta-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 20px; margin-bottom: 28px;
  }
  .meta-card {
    background: #f8fafc; border-radius: 10px;
    padding: 16px 20px; border: 1px solid #e2e8f0;
  }
  .meta-card h3 {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 8px;
  }
  .meta-card .name { font-size: 15px; font-weight: 600; color: #0f172a; }
  .meta-card .info { font-size: 12px; color: #475569; margin-top: 2px; }

  .items-section { flex: 1; margin-bottom: 24px; }
  .items-section h2 {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 10px;
  }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    text-align: left; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: #64748b; padding: 10px 12px;
    border-bottom: 2px solid #e2e8f0;
  }
  thead th.right { text-align: right; }
  tbody td {
    padding: 12px 12px; font-size: 13px;
    border-bottom: 1px solid #f1f5f9; vertical-align: middle;
  }
  tbody td.right { text-align: right; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  .item-name { font-weight: 500; color: #0f172a; }
  .item-qty { color: #64748b; }

  .bottom-section {
    display: flex; gap: 16px; margin-bottom: 28px; align-items: flex-start;
  }
  .extras-left {
    flex: 1; display: flex; flex-direction: column; gap: 12px;
  }
  .extra-item {
    padding: 12px 16px; background: #f8fafc;
    border-radius: 8px; border: 1px solid #e2e8f0;
  }
  .extra-item h4 {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 4px;
  }
  .extra-item p { font-size: 13px; color: #1e293b; }
  .totals-box {
    width: 260px; flex-shrink: 0; background: #0f172a; border-radius: 10px;
    padding: 20px 24px; color: #fff;
  }
  .totals-row {
    display: flex; justify-content: space-between;
    margin-bottom: 8px; font-size: 13px;
  }
  .totals-row.grand-total {
    border-top: 1px solid rgba(255,255,255,0.15);
    padding-top: 10px; margin-top: 4px; margin-bottom: 0;
    font-size: 18px; font-weight: 700;
  }
  .totals-label { color: #94a3b8; }
  .totals-row.grand-total .totals-label { color: #cbd5e1; }

  .footer {
    border-top: 2px solid #e2e8f0; padding-top: 14px;
    text-align: center; font-size: 11px; color: #94a3b8;
  }
  .footer-links { margin-top: 4px; }
  .footer-links span { margin: 0 8px; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <div class="logo">
        ${data.company.logoUrl
					? `<img src="${escapeHtml(data.company.logoUrl)}" alt="Logo"/>`
					: `<span>${e(data.company.name).charAt(0).toUpperCase()}</span>`}
      </div>
      <div class="company-info">
        <h1>${e(data.company.name)}</h1>
        ${data.company.tradeName ? `<div class="trade-name">${e(data.company.tradeName)}</div>` : ''}
        <div class="details">
          ${data.company.cnpj ? `CNPJ: ${e(data.company.cnpj)}<br/>` : ''}
          ${companyAddress ? `${companyAddress}<br/>` : ''}
          ${data.company.email ? `${e(data.company.email)}` : ''}
          ${data.company.email && data.company.phone ? ' · ' : ''}
          ${data.company.phone ? `${e(data.company.phone)}` : ''}
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="invoice-title">FATURA</div>
      <div class="invoice-id">#${shortId}</div>
      <div class="status-badge">${statusLabel}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card">
      <h3>Cliente</h3>
      <div class="name">${e(data.client.name)}</div>
      <div class="info">${e(data.client.phone || '')}</div>
      ${clientAddress ? `<div class="info">${clientAddress}</div>` : ''}
    </div>
    <div class="meta-card">
      <h3>Detalhes</h3>
      <div class="info">Emitida em: ${formatDateTime(data.createdAt)}</div>
      ${data.deliveryDate ? `<div class="info">Entrega: ${formatDate(data.deliveryDate)}</div>` : ''}
      ${data.paidAt ? `<div class="info">Pagamento: ${formatDateTime(data.paidAt)}</div>` : ''}
    </div>
  </div>

  <div class="items-section">
    <h2>Itens</h2>
    <table>
      <thead>
        <tr>
          <th style="width:40%">Produto</th>
          <th class="right">Qtd</th>
          <th>Unidade</th>
          <th class="right">Preço Unit.</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
					.map(
						(item) => `
        <tr>
          <td class="item-name">${e(item.name)}</td>
          <td class="right item-qty">${item.quantity.toLocaleString('pt-BR')}</td>
          <td>${e(item.unit)}</td>
          <td class="right">${formatCurrency(item.unitPrice)}</td>
          <td class="right" style="font-weight:600">${formatCurrency(item.quantity * item.unitPrice)}</td>
        </tr>`,
					)
					.join('')}
      </tbody>
    </table>
  </div>

  <div class="bottom-section">
    <div class="extras-left">
      <div class="extra-item">
        <h4>Forma de Pagamento</h4>
        <p>${e(paymentLabel || '—')}</p>
      </div>
      ${data.paymentNotes ? `
      <div class="extra-item">
        <h4>Notas do Pagamento</h4>
        <p>${e(data.paymentNotes)}</p>
      </div>` : ''}
      ${data.notes ? `
      <div class="extra-item">
        <h4>Observações</h4>
        <p>${e(data.notes)}</p>
      </div>` : ''}
    </div>
    <div class="totals-box">
      <div class="totals-row">
        <span class="totals-label">Subtotal</span>
        <span>${formatCurrency(total)}</span>
      </div>
      <div class="totals-row">
        <span class="totals-label">Desconto</span>
        <span>${formatCurrency(0)}</span>
      </div>
      <div class="totals-row grand-total">
        <span class="totals-label">TOTAL</span>
        <span>${formatCurrency(total)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>Obrigado pela preferência!</div>
    <div class="footer-links">
      ${data.company.website ? `<span>${e(data.company.website)}</span>` : ''}
      ${data.company.email ? `<span>${e(data.company.email)}</span>` : ''}
      ${data.company.whatsapp ? `<span>WhatsApp: ${e(data.company.whatsapp)}</span>` : ''}
    </div>
  </div>

</div>
</body>
</html>`
}
