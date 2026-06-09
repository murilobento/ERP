# Security Review: Sistema de Gestão (ERP)

**Data:** 08 de junho de 2026
**Escopo:** Aplicação completa (API server, frontend, infraestrutura)
**Stack:** Hono + Prisma + PostgreSQL (server) / React + TanStack Router (frontend)

---

## Resumo

| Métrica | Valor |
|---------|-------|
| **Findings** | 6 |
| **Resolvidos** | 5 |
| **Pendentes** | 1 |
| **Risk Level** | Medium |
| **Confidence** | High |

---

## Findings

### HIGH

#### [VULN-001] Usuário admin padrão com credenciais fracas seedado automaticamente — RESOLVIDO

- **Location:** `server/src/index.ts:10-18`
- **Confidence:** High
- **Issue:** Toda vez que o servidor inicia, ele verifica se o usuário `admin@admin.com` com senha `admin123` existe, e o cria se não existir. Essa lógica roda em **todos os ambientes** (dev, staging, production).
- **Impact:** Em produção, o usuário admin com credenciais óbvias fica disponível para qualquer pessoa que saiba o email.
- **Fix aplicado:** Seed agora só executa quando `NODE_ENV !== 'production'` (`server/src/index.ts:22-24`). Em produção, nenhuma conta padrão é criada.

#### [VULN-002] IDOR em rotas de usuários — qualquer usuário pode editar/deletar qualquer outro — RESOLVIDO

- **Location:** `server/src/routes/users.ts:53-105`
- **Confidence:** High
- **Issue:** As rotas `PATCH /:id` e `DELETE /:id` de usuários aceitam qualquer ID como parâmetro sem verificar se o usuário autenticado é o próprio. Qualquer usuário autenticado pode alterar a senha de outro usuário ou deletá-lo.
- **Impact:** Um usuário pode assumir a conta de outro alterando seu email/senha, ou deletar todos os usuários.
- **Fix aplicado:** Rota DELETE removida. Rota PATCH agora verifica `authUserId !== userId` retornando 403 se não for a própria conta (`server/src/routes/users.ts:64-66`). Sistema de auditoria implementado — todas as criações e edições de usuários são registradas com autor, alvo e diff das alterações (`AuditLog` model, `server/src/routes/audit-logs.ts`).

---

### MEDIUM

#### [VULN-003] Fallback de JWT Secret em desenvolvimento

- **Location:** `server/src/lib/auth.ts:7-17`
- **Confidence:** High
- **Issue:** Em ambientes não-production, o segredo JWT usado é `'dev-secret-change-in-production'`. Se `NODE_ENV` não for configurado como `production`, todos os tokens usam esse segredo previsível.
- **Impact:** Se o deploy for feito sem `NODE_ENV=production`, os tokens podem ser forjados.
- **Fix:** Remover o fallback. Exigir `JWT_SECRET` em todos os ambientes via variável de ambiente.

#### [VULN-004] CORS hardcoded para localhost — RESOLVIDO

- **Location:** `server/src/app.ts:25-31`
- **Confidence:** High
- **Issue:** O CORS está configurado para aceitar apenas `http://localhost:5173`. Em produção, isso precisa ser configurável.
- **Fix aplicado:** CORS agora usa `process.env.CORS_ORIGIN` com suporte a múltiplas origens separadas por vírgula (`server/src/app.ts:27-30`). Variável adicionada ao `.env.example`.

#### [VULN-005] XSS potencial na geração de PDF de faturas — RESOLVIDO

- **Location:** `server/src/lib/invoice-template.ts:250-312`
- **Confidence:** High
- **Issue:** Os dados do banco (nomes de clientes, produtos, endereços, etc.) são interpolados diretamente no HTML via template literals sem sanitização.
- **Impact:** Injeção de conteúdo visual no PDF (nomes de produtos/clientes com tags HTML).
- **Fix aplicado:** Adicionada função `escapeHtml` (`server/src/lib/invoice-template.ts:100-106`) aplicada em todos os valores interpolados no template (nomes, telefones, endereços, emails, notas, URLs).

#### [VULN-006] Ausência de rate limiting e proteção contra brute force — RESOLVIDO

- **Location:** `server/src/routes/auth.ts:22-63`, `server/src/app.ts`
- **Confidence:** High
- **Issue:** Não existe nenhuma proteção contra brute force no endpoint de login. Um atacante pode tentar senhas indefinidamente.
- **Fix aplicado:** Rate limiting in-memory implementado (`server/src/routes/auth.ts:23-42`) — 5 tentativas por IP por janela de 60 segundos, retorna HTTP 429 quando excedido, contador limpo após login bem-sucedido.

---

## Pontos Fortes

| Aspecto | Detalhe | Arquivo |
|---------|---------|---------|
| **Prisma ORM** | Previne SQL injection — todas as queries usam o query builder | `server/src/routes/*.ts` |
| **HttpOnly cookies** | Tokens não são acessíveis via JavaScript — previne XSS token theft | `server/src/routes/auth.ts:16-20` |
| **SameSite=Lax** | Cookies de autenticação usam `SameSite: 'lax'` — mitiga CSRF | `server/src/routes/auth.ts:19` |
| **bcrypt com salt rounds 12** | Hashing de senhas robusto | `server/src/lib/auth.ts:20` |
| **Separação access/refresh tokens** | Tokens com propriedades `type: 'access'` vs `'refresh'` separadas | `server/src/lib/auth.ts:31-39` |
| **Validação de type no middleware** | Middleware rejeita refresh tokens em endpoints protegidos | `server/src/middleware/auth.ts:13` |
| **React auto-escaping** | Frontend não usa `dangerouslySetInnerHTML` — sem XSS no browser | Frontend inteiro |
| **.env no .gitignore** | Arquivo de ambiente nunca foi commitado ao git | `.gitignore:15` |
| **Select explícito** | Rotas de usuários usam `USER_SELECT` sem expor senhas | `server/src/routes/users.ts:10-17` |
| **Timeouts em tokens** | Access token: 15min, Refresh token: 7 dias | `server/src/lib/auth.ts:4-5` |
| **API client com refresh automático** | Interceptor Axios faz refresh silencioso em 401 com fila de requisições | `src/lib/api.ts` |
| **Rotas protegidas no frontend** | Guard `beforeLoad` em `_authenticated` valida sessão via `/api/auth/me` | `src/routes/_authenticated/route.tsx` |

---

## Pontos Fracos

| Aspecto | Detalhe |
|---------|---------|
| **JWT fallback previsível** | Segredo hardcoded em dev pode vazar para produção |
| **Sem headers de segurança** | Ausência de X-Content-Type-Options, X-Frame-Options, etc. |

---

## Recomendações Priorizadas

| # | Prioridade | Ação | Status |
|---|-----------|------|--------|
| 1 | **Alta** | Proteger seed do admin padrão com verificação de `NODE_ENV` — não rodar em produção | Concluído |
| 2 | **Alta** | Remover DELETE de usuários + verificação de ownership no PATCH + auditoria de logs | Concluído |
| 3 | **Média** | Remover fallback de JWT secret — exigir variável de ambiente em todos os ambientes | Pendente |
| 4 | **Média** | Tornar CORS configurável via `process.env.CORS_ORIGIN` | Concluído |
| 5 | **Média** | Sanitizar dados interpolados no template HTML de PDF (escapar `<`, `>`, `&`) | Concluído |
| 6 | **Média** | Implementar rate limiting no login (5 tentativas por minuto por IP) | Concluído |
| 7 | **Baixa** | Adicionar headers de segurança HTTP (X-Content-Type-Options, X-Frame-Options, CSP) | Pendente |
| 8 | **Baixa** | Implementar CSRF token como camada adicional além do `SameSite` | Pendente |
| 9 | **Baixa** | Adicionar atributos `autocomplete` nos campos de senha do frontend | Pendente |
| 10 | **Baixa** | Sanitizar mensagens de erro do backend antes de exibir em toasts no frontend | Pendente |

---

## Metodologia

Esta análise foi realizada seguindo o framework OWASP Cheat Sheet Series, com investigação de fluxo de dados em todo o codebase para determinar a exploração real de cada vulnerabilidade. Foram revisados:

- **15 arquivos de rotas** da API server
- **4 arquivos de lib** (auth, stock, pdf, prisma)
- **1 middleware** de autenticação
- **Schema Prisma** completo (16 models)
- **Frontend** — API client, auth store, route guards, componentes
- **Infraestrutura** — CI/CD, .gitignore, netlify.toml, .env
