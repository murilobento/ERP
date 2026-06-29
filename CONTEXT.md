# CONTEXT

Linguagem de domínio deste projeto. Termos que dão nome a seams de bom tamanho.
Use este vocabulário ao falar do código — não os nomes de arquivo/handler.

## Estoque

- **Stock Ledger (Razão de Estoque)** — módulo profundo (`server/src/lib/stock.ts`)
  dono da leitura e da escrita de saldo de estoque. Toda movimentação de saldo
  passa por ele. Centraliza: o vocabulário de tipos de movimento
  (`MOVEMENT_TYPE`), o cálculo de `stockBefore`/`stockAfter` sequenciado por
  transação, a formatação de `notes`, e a invariante de saldo não-negativo para
  consumo/entrega. Rotas de Sales, Purchases, Productions e Stock chamam seus
  métodos por operação de negócio (`recordSaleDelivery`,
  `recordProductionCompletion`, etc.) e nunca gravam `StockMovement` diretamente.

- **StockMovement** — registro imutável e contábil de uma variação de saldo de
  um item (produto ou insumo). Anexado a uma entidade-pai via `referenceId`
  (Sale, Purchase, Production ou StockAdjustment). O `type` é classificado de
  volta à entidade-pai por `movementParentEntity()`.

- **Produto** — item fabricado/vendido. Tem `composition` (receita de insumos) e
  `margin`. Saldo movimentado em entregas de venda e saídas de produção.

- **Insumo (Supply)** — item comprado/consumido. Tem `packageQuantity` e
  `costPrice` (recalculado pela média das últimas compras ao concluir uma
  Purchase). Saldo movimentado em conclusões de compra (entrada) e consumo de
  produção (saída).

- **Composição (ProductComposition)** — receita: quanto de cada insumo compõe
  uma unidade de produto. Expandida em consumo de produção por
  `expandConsumption()`.

## Preço

- **Pricing (Formação de Preço)** — módulo profundo (`server/src/lib/pricing.ts`)
  dono da derivação de preço a partir de custo e margem. Centraliza:
  `computeProductCost` (soma da composição × `Supply.costPrice`),
  `computeProductSalePrice`/`computeProductPrices` (custo × `(1 + margin/100)`),
  `computeKitPricing` (total do kit, desconto fixo/percentual, preço final) e
  `expandKitIntoSaleItems` (expande um kit em itens de venda com preço
  proporcional). Rotas de Products, Kits e Sales chamam-no e nunca reescrevem a
  fórmula. Cadeia implícita: conclusão de Purchase recalcula `Supply.costPrice`
  → todos os preços derivados mudam.

## Transações de domínio

- **Sale** — venda ao cliente. Ciclo de status: `in_preparation` →
  `ready_for_delivery` → `delivered` → `completed`. Entrega decrementa estoque
  de produto; estorno devolve.
- **Purchase** — compra de insumo. `pending` → `completed`. Conclusão incrementa
  estoque de insumo e recalcula `Supply.costPrice`; estorno reverte ambos.
- **Production** — transformação de insumos em produtos. `in_production` →
  `completed`. Criação já nasce em `in_production` (sem rascunho). Conclusão
  emite saída de produto e consome insumos (composição); estorno reverte e
  volta ao status default (`in_production`). Pode também ser `cancelled`.
- **StockAdjustment** — acerto manual de saldo. `pending` → `completed`
  (registrado) → `reversed`. Pode ser positivo ou negativo.

## Frontend

- **Query Keys Registry** — módulo profundo (`src/lib/query-keys.ts`)
  dono centralizado de todas as chaves de query do React Query. Lista: todas as
  entidades CRUD (`clients`, `vendors`, `products`, `supplies`, `kits`,
  `categories`, `purchases`, `productions`, `sales`, `users`), sub-domínio de
  estoque (`stock.adjustments`, `stock.balances`, `stock.movements`), dashboard
  (`dashboard.metrics`, `dashboard.analytics`), e factories de detail
  (`purchases(id)`, `sales(id)`, etc.). Elimina chaves mágicas duplicadas — uma
  mudança de invalidateQueries toca 1 arquivo, não N componentes.

- **useEntityMutation** — hook profundo (`src/lib/use-entity-mutation.ts`)
  dono do padrão de mutação em toda a aplicação. Centraliza: `run({mutation,
  invalidate?, successMessage?, onSuccess?})` → `{run, isLoading}`, toast no
  sucesso, `handleServerError` no catch (swallow), loop de invalidateQueries.
  Cada componente chama uma vez; ação múltipla (edit/complete/reverse) usa
  múltiplas chamadas a `run(options)` com `isLoading` compartilhado.

## Backend — Módulos profundos

- **Contact Routes (Fábrica de Rotas de Contato)** — módulo profundo
  (`server/src/lib/contact-routes.ts`) dono do CRUD de entidades de contato
  (Client, Vendor). `createContactRoutes(config)` gera rotas `GET /`,
  `GET /search`, `POST /`, `GET /:id`, `PATCH /:id`, `PATCH /:id/status`
  parametrizadas por modelo Prisma, nome da entidade, chaves de resposta, e
  select de detail. Elimina cópia integral entre `clients.ts` e `vendors.ts`.

- **Date Range Utils** — funções puras (`getDayStart`, `getDayEnd`,
  `isWithinRange`) consolidadas em `src/features/shared/filter-date-utils.ts`.
  Antes duplicadas character-for-character em 4 módulos de filtro (sales,
  purchases, productions, stock).
