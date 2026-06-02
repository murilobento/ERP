# Plano de Refatoracao

Analise baseada nas Vercel React Best Practices e arquitetura geral do app.

## Stack

- **Frontend:** Vite + React 19 SPA + TanStack Router + TanStack Query + Zustand
- **Backend:** Hono + Prisma (event-sourced stock)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Auth:** Cookie-based JWT (access + refresh)

---

## Inventario

### Frontend - 13 features, 124 arquivos, ~13.400 linhas

| Feature | Arquivos | Linhas | Padrao | Dialogos | Adicoes Unicas |
|---|---|---|---|---|---|
| auth | 3 | 168 | Login | N/A | Auth layout, sign-in form |
| categories | 10 | 703 | CRUD padrao | `add \| edit \| delete` | Nenhuma |
| clients | 11 | 1.100 | CRUD + bulk | `add \| edit \| delete` | `data-table-bulk-actions.tsx` |
| company | 2 | 613 | Formulario | N/A | Busca CEP, logo preview, 590 linhas |
| dashboard | 5 | 623 | Display | N/A | Charts, KPI cards |
| errors | 5 | 130 | Paginas estaticas | N/A | 5 paginas de erro |
| productions | 11 | 1.350 | CRUD parcial | `add \| view \| delete` | Detail dialog, bulk status actions |
| products | 11 | 1.089 | CRUD + composicao | `add \| edit \| delete \| composition` | Composition dialog (BOM) |
| purchases | 11 | 1.181 | CRUD parcial | `add \| view \| edit` | Detail dialog, bulk actions |
| sales | 15 | 2.785 | Pipeline estendido | `add \| view \| edit` + kanban | Kanban, filters, detail 814 linhas |
| stock | 7 | 821 | Somente leitura + form | N/A | 2 tabelas, formulario de ajuste |
| supplies | 10 | 821 | CRUD padrao | `add \| edit \| delete` | Nenhuma |
| users | 11 | 903 | CRUD + bulk + invite | `invite \| add \| edit \| delete` | Bulk actions, invite dialog |
| vendors | 11 | 1.109 | CRUD + bulk | `add \| edit \| delete` | Bulk actions |

### Backend - 13 rotas, ~3.000 linhas

| Rota | Linhas | Endpoints | Search | N+1 | State Machine | SELECT Const |
|---|---|---|---|---|---|---|
| auth.ts | 134 | 4 | Nao | Nao | Nao | Nao |
| categories.ts | 104 | 5 | Nao | Nao | Nao | Nao (include) |
| clients.ts | 151 | 5 | Sim | Nao | Nao | Sim |
| company.ts | 109 | 2 | Nao | Nao | Nao | Sim |
| productions.ts | 611 | 8 | Nao | Sim (3 locais) | Sim (4 transicoes) | Sim |
| products.ts | 297 | 9 | Sim | Sim (3 locais) | Nao | Sim |
| purchases.ts | 386 | 6 | Nao | Sim (2 locais) | Sim (2 transicoes) | Sim |
| sales.ts | 467 | 8 | Nao | Sim (2 locais) | Sim (4 transicoes) | Sim |
| stock.ts | 188 | 3 | Nao | Sim (1 local, todos) | Nao | Nao |
| supplies.ts | 199 | 6 | Sim | Sim (3 locais) | Nao | Sim |
| users.ts | 107 | 4 | Nao | Nao | Nao | Sim |
| vendors.ts | 151 | 5 | Sim | Nao | Nao | Sim |

---

## Duplicacao Identificada

### Frontend

| Componente | Duplicacao | Features Afetadas | Linhas Duplicadas |
|---|---|---|---|
| `*-provider.tsx` | ~97% | 8 features | ~260 |
| `index.tsx` (pagina) | ~92% | 9 features | ~400 |
| `*-table.tsx` (setup) | ~85% | 9 features | ~1.200 |
| `data-table-row-actions.tsx` | ~93% | 6+ features | ~330 |
| `*-primary-buttons.tsx` | 100% | 9 features (14 linhas cada) | ~126 |
| `*-action-dialog.tsx` (skeleton) | ~45% | 10 features | ~600 |
| `*-delete-dialog.tsx` | ~80% | 5 features | ~400 |
| `*-dialogs.tsx` (orquestrador) | ~70% | 9 features | ~300 |
| **Total estimado** | | | **~3.600** |

### Backend

| Componente | Duplicacao | Rotas Afetadas |
|---|---|---|
| `clients.ts` vs `vendors.ts` | ~95% | 2 (151 linhas cada) |
| Search endpoint pattern | ~90% | 4 rotas |
| Existence check + 404 | 100% | Todas |
| Partial update builder | ~85% | 6 rotas |
| Stock movement creation | ~80% | 4 rotas |
| Reversal pattern | ~75% | 3 rotas |

---

## FASE 1 - Correcao de Performance Critica (N+1 Queries)

**Impacto:** CRITICO | **Esforco:** Medio | **Risco:** Baixo

O calculo de estoque faz 1 query por item via `prisma.stockMovement.aggregate()`. Com 100 produtos + 50 insumos = 152 queries por request.

### Problema

```ts
// Atual: N+1 queries
const products = await prisma.product.findMany()
const productsWithStock = await Promise.all(
  products.map(async (p) => {
    const stock = await prisma.stockMovement.aggregate({
      where: { productId: p.id },
      _sum: { quantity: true },
    })
    return { ...p, stock: stock._sum.quantity ?? 0 }
  })
)
```

### Tarefas

- [ ] **1.1** Criar `server/src/lib/stock.ts` com funcoes centralizadas:
  - `getStockByProduct(productIds?: string[])` - aggregate com `groupBy`
  - `getStockBySupply(supplyIds?: string[])` - aggregate com `groupBy`
  - `getStockForProduct(productId: string)` - lookup unico
  - `getStockForSupply(supplyId: string)` - lookup unico
- [ ] **1.2** Refatorar `stock.ts` GET /balances (pior caso: itera TODOS os produtos e insumos)
- [ ] **1.3** Refatorar `supplies.ts` GET /, GET /search, GET /:id (3 locais)
- [ ] **1.4** Refatorar `products.ts` GET /, GET /search, GET /:id (3 locais)
- [ ] **1.5** Refatorar `productions.ts` GET /:id, complete, reverse (dentro de transacoes)
- [ ] **1.6** Refatorar `purchases.ts` complete, reverse (dentro de transacoes)
- [ ] **1.7** Refatorar `sales.ts` deliver, reverse (dentro de transacoes)
- [ ] **1.8** Rodar testes de API: `npm run test:api`

### Resultado esperado

Reducao de ~150 queries para ~4 queries nos piores casos.

### Arquivos alterados

```
server/src/lib/stock.ts          (novo)
server/src/routes/stock.ts
server/src/routes/supplies.ts
server/src/routes/products.ts
server/src/routes/productions.ts
server/src/routes/purchases.ts
server/src/routes/sales.ts
```

---

## FASE 2 - Abstracoes do Backend (CRUD Factory + Validacao)

**Impacto:** ALTO | **Esforco:** Medio | **Risco:** Medio

### Tarefas

- [ ] **2.1** Adicionar validacao Zod nas rotas do backend (Zod ja esta no projeto):
  ```
  server/src/schemas/
    auth.schema.ts
    users.schema.ts
    clients.schema.ts
    vendors.schema.ts
    categories.schema.ts
    supplies.schema.ts
    products.schema.ts
    productions.schema.ts
    purchases.schema.ts
    sales.schema.ts
    stock.schema.ts
    company.schema.ts
  ```
  Elimina validacao manual inconsistente e padroniza mensagens de erro.
- [ ] **2.2** Adicionar error handler global em `app.ts`:
  - `app.onError()` para capturar erros nao tratados e retornar 500 limpo
  - Centralizar formato de resposta de erro
- [ ] **2.3** Padronizar idioma das mensagens de erro (auth.ts e users.ts estao em EN, resto em PT)
- [ ] **2.4** Criar CRUD factory para rotas identicas:
  ```
  server/src/lib/crud-factory.ts
  server/src/lib/search-handler.ts
  ```
  `clients.ts` vs `vendors.ts` tem 95% de duplicacao (151 linhas cada).
- [ ] **2.5** Migrar `vendors.ts` usando factory (prova de conceito)
- [ ] **2.6** Adicionar paginacao nos endpoints de listagem (GET /)
- [ ] **2.7** Rodar testes de API apos cada mudanca: `npm run test:api`

### Resultado esperado

~300 linhas eliminadas, validacao consistente, error handling robusto.

### Arquivos alterados

```
server/src/lib/crud-factory.ts       (novo)
server/src/lib/search-handler.ts     (novo)
server/src/schemas/*.schema.ts       (novos)
server/src/app.ts                    (error handler)
server/src/routes/vendors.ts         (migrar para factory)
server/src/routes/*.ts               (validacao Zod)
```

---

## FASE 3 - Abstracoes do Frontend (Provider + Table + Mutation)

**Impacto:** ALTO | **Esforco:** Alto | **Risco:** Medio

### Estrutura proposta

```
src/features/shared/
  create-entity-provider.tsx      # Factory: Provider + useEntity tipados
  use-data-table.ts               # Hook: todo boilerplate TanStack Table
  use-entity-mutation.ts          # Hook: mutation + invalidation + toast
  data-table-wrapper.tsx          # Componente: JSX generico de tabela
  row-actions.tsx                 # Componente: acoes de linha genericas
  entity-page-layout.tsx          # Layout: Header + Main + Provider + Dialogs
```

### Tarefas

- [ ] **3.1** Criar `createEntityProvider<T>()` factory:
  ```tsx
  // Elimina 97% de duplicacao em 8 providers (~260 linhas)
  export function createEntityProvider<T, D extends string>(name: string) {
    const Context = createContext<EntityContextType<T, D> | null>(null)
    function Provider({ children }: { children: React.ReactNode }) { ... }
    function useEntity() { ... }
    return { Provider, useEntity }
  }
  ```
- [ ] **3.2** Criar `useDataTable()` hook:
  ```tsx
  // Elimina 85% de duplicacao em 8 tabelas (~1.200 linhas)
  // Encapsula: useState (rowSelection, columnVisibility, sorting)
  //            + useTableUrlState + useReactTable config + useEffect
  export function useDataTable<T>({ columns, data, globalFilterFn, ... }) {
    // ... todo o boilerplate
    return { table, states }
  }
  ```
- [ ] **3.3** Criar `useEntityMutation()` hook:
  ```tsx
  // Elimina useState(false) de loading em 10+ dialogs
  export function useEntityMutation({ entityName, queryKey, endpoint }) {
    return useMutation({
      mutationFn: ({ id, values, isEdit }) => ...,
      onSuccess: () => { queryClient.invalidateQueries(...); toast.success(...) },
      onError: (error) => { toast.error(...) },
    })
  }
  ```
- [ ] **3.4** Criar `DataTableWrapper` component:
  - JSX generico com toolbar, pagination, bulk actions slots
- [ ] **3.5** Migrar `categories` (feature mais simples) como prova de conceito:
  - Substituir provider -> factory
  - Substituir table -> useDataTable + DataTableWrapper
  - Substituir mutation -> useEntityMutation
  - Validar visualmente
- [ ] **3.6** Migrar features restantes na ordem:
  1. `supplies` (CRUD padrao)
  2. `users` (CRUD + bulk + invite)
  3. `clients` (CRUD + bulk)
  4. `vendors` (CRUD + bulk)
  5. `products` (CRUD + composition)
  6. `productions` (CRUD parcial + detail)
  7. `purchases` (CRUD parcial + detail)
  8. `sales` (pipeline estendido - mais complexo)
- [ ] **3.7** Rodar testes: `npm run test:unit`

### Resultado esperado

~1.800 linhas de boilerplate eliminadas. Nova feature CRUD em minutos.

### Arquivos alterados

```
src/features/shared/                (novos 5-6 arquivos)
src/features/categories/**          (migrar)
src/features/supplies/**            (migrar)
src/features/users/**               (migrar)
src/features/clients/**             (migrar)
src/features/vendors/**             (migrar)
src/features/products/**            (migrar)
src/features/productions/**         (migrar)
src/features/purchases/**           (migrar)
src/features/sales/**               (migrar)
```

---

## FASE 4 - Melhorias de Re-render e Data Fetching

**Impacto:** MEDIO | **Esforco:** Medio | **Risco:** Baixo

### Tarefas

- [ ] **4.1** Migrar mutations restantes para `useMutation` (regra `rerender-functional-setstate`)
  - Substituir `useState(false)` + try/catch manual
  - `mutation.isPending` substitui `isLoading`
- [ ] **4.2** Revisar `useEffect` para `ensurePageInRange` (regra `rerender-derived-state-no-effect`)
  - Derivar durante render ao inves de effect
  - Ou mover logica para dentro do hook `useDataTable`
- [ ] **4.3** Criar `RowActions` generico (regra `rerender-no-inline-components`)
  - Elimina 93% de duplicacao em 6+ features (~330 linhas)
- [ ] **4.4** Unificar bulk-delete em componente generico
  - `clients`, `users`, `vendors` sao quase identicas
  - Reusar `DataTableDeleteBulkActions` que ja existe em `components/data-table/`
- [ ] **4.5** Revisar comboboxes (`client-combobox`, `vendor-combobox`, `product-supply-combobox`)
  - Verificar se podem compartilhar um `AsyncCombobox` generico
- [ ] **4.6** Corrigir renderizacao condicional (regra `rendering-conditional-render`)
  - Trocar `{condition && <Component />}` por `{condition ? <Component /> : null}`

### Resultado esperado

Menos re-renders, hooks mais limpos, menos duplicacao.

---

## FASE 5 - Bundle Optimization e UX

**Impacto:** MEDIO | **Esforco:** Baixo | **Risco:** Baixo

### Tarefas

- [ ] **5.1** Lazy-load `recharts` (regra `bundle-dynamic-imports`)
  - Dashboard charts so sao usados em 1 pagina
  - `const AnalyticsChart = lazy(() => import('./analytics-chart'))`
- [ ] **5.2** Lazy-load kanban components em sales
  - `sales-kanban.tsx` + `sales-kanban-action-dialog.tsx` so na tab kanban
- [ ] **5.3** Verificar tree-shaking de `lucide-react` (regra `bundle-barrel-imports`)
  - Confirmar que nao ha import de todo o pacote
- [ ] **5.4** Adicionar `content-visibility: auto` em tabelas longas (regra `rendering-content-visibility`)
- [ ] **5.5** Analisar bundle com `vite-bundle-visualizer` para identificar oportunidades

### Resultado esperado

Bundle menor, carregamento mais rapido.

---

## FASE 6 - Qualidade e Robustez

**Impacto:** BAIXO-MEDIO | **Esforco:** Baixo | **Risco:** Baixo

### Tarefas

- [ ] **6.1** Adicionar graceful shutdown no server (`index.ts`)
- [ ] **6.2** Adicionar safeguard no `users.ts` DELETE (nao pode deletar usuario que autorou stock movements)
- [ ] **6.3** Adicionar rate limiting no endpoint de sign-in
- [ ] **6.4** Extrair `Company index.tsx` (590 linhas) em sub-componentes:
  - `company-basic-data-form.tsx`
  - `company-address-form.tsx`
  - `company-social-links-form.tsx`
- [ ] **6.5** Extrair `Sales detail dialog` (814 linhas) em sub-componentes
- [ ] **6.6** Obrigar `JWT_SECRET` via env var (remover fallback hardcoded)
- [ ] **6.7** Adicionar testes unitarios para abstracoes criadas (factory de provider, useDataTable, useEntityMutation)

### Resultado esperado

Codigo mais robusto, seguro e testavel.

---

## Resumo de Impacto

| Fase | Foco | Linhas Eliminadas | Queries Reduzidas | Prioridade |
|---|---|---|---|---|
| 1 | N+1 Queries | ~0 (refatora) | ~150 -> ~4 | CRITICA |
| 2 | Backend Factory + Validacao | ~300 | - | ALTA |
| 3 | Frontend Abstracoes | ~1.800 | - | ALTA |
| 4 | Re-render + Data Fetching | ~330 | - | MEDIA |
| 5 | Bundle + UX | ~50 | - | MEDIA |
| 6 | Qualidade | ~0 (divide) | - | BAIXA |

## Regras Aplicaveis (Vercel React Best Practices)

| Regra | Status | Local |
|---|---|---|
| `bundle-barrel-imports` | Ja seguido - quase sem barrel files | - |
| `bundle-dynamic-imports` | Parcialmente - recharts/kanban podem ser lazy | Dashboard, Sales |
| `async-parallel` | Violar - N+1 queries no backend | stock.ts, supplies.ts, products.ts |
| `rerender-derived-state-no-effect` | Violar - useEffect em tables | Todos os `*-table.tsx` |
| `rerender-functional-setstate` | Violar - useState para loading | Todos os `*-action-dialog.tsx` |
| `rerender-no-inline-components` | Seguido - sem componentes inline | - |
| `server-serialization` | Violar - queries retornam todos os campos | Backend routes |
| `js-set-map-lookups` | Melhoria - stock lookup usa loop | stock.ts, products.ts |
| `rendering-conditional-render` | Violar - usa `&&` ao inves de ternario | Features diversas |
