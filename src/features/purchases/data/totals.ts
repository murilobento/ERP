type PricedItem = {
  packages: number
  packageCost: number
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Custo por unidade base (R$/un) derivado do preço da embalagem.
 * Ex.: saco de 5 kg a R$ 10,00 => R$ 2,00/kg.
 */
export function itemUnitPrice(packageCost: number, packageQuantity?: number) {
  const pkgQty = packageQuantity || 1
  if (pkgQty <= 0) return packageCost
  return packageCost / pkgQty
}

/** Total gasto no item: embalagens × preço da embalagem. */
export function itemTotal(item: PricedItem) {
  return item.packages * item.packageCost
}

/** Total gasto na compra: soma dos totais dos itens. */
export function purchaseTotal(items: PricedItem[]) {
  return items.reduce((sum, item) => sum + itemTotal(item), 0)
}

/** Quantidade física recebida: embalagens × conteúdo de cada embalagem. */
export function itemQuantity(packages: number, packageQuantity?: number) {
  return packages * (packageQuantity || 1)
}
