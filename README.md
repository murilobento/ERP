# Lume Artisan

Sistema de gestão para produção e venda de produtos artesanais.

O projeto reúne cadastro de clientes, fornecedores, produtos, insumos, kits,
compras, produções, vendas e estoque. O backend também controla autenticação,
permissões, movimentações contábeis de estoque e emissão de faturas em PDF.

## Sumário

- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Execução local](#execução-local)
- [Comandos úteis](#comandos-úteis)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy na Vercel](#deploy-na-vercel)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Limitações conhecidas](#limitações-conhecidas)

## Visão geral

O Lume Artisan é uma aplicação de duas camadas:

| Camada   | Responsabilidade             | Desenvolvimento | Produção                     |
| -------- | ---------------------------- | --------------- | ---------------------------- |
| Frontend | Interface SPA em React       | Vite em `:5173` | Arquivos estáticos na Vercel |
| Backend  | API REST e regras de negócio | Hono em `:3001` | Function Node.js da Vercel   |
| Banco    | Persistência e migrations    | PostgreSQL      | Neon PostgreSQL              |

No desenvolvimento, o Vite encaminha `/api` para o backend. Em produção,
frontend e backend usam o mesmo domínio, preservando o funcionamento dos
cookies de autenticação.

## Tecnologias

- React 19, Vite e TypeScript
- TanStack Router, TanStack Query e TanStack Table
- Hono e `@hono/node-server`
- PostgreSQL e Prisma 6
- JWT em cookies `httpOnly`
- Puppeteer local e Chromium serverless para PDFs
- Bun como gerenciador de dependências
- Vitest e Playwright para testes

## Pré-requisitos

Instale os seguintes componentes:

- [Bun](https://bun.sh/)
- PostgreSQL local ou uma instância PostgreSQL hospedada
- Chromium do Playwright para executar os testes de frontend

Confira as versões disponíveis:

```bash
bun --version
psql --version
```

## Execução local

### 1. Obter o projeto

```bash
git clone <url-do-repositorio> lumeartisan
cd lumeartisan
```

### 2. Instalar dependências

```bash
bun install
```

O `postinstall` gera automaticamente o Prisma Client.

### 3. Configurar o ambiente

Crie o arquivo local de variáveis:

```bash
cp .env.example .env
```

Edite o `.env` com os dados do PostgreSQL:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/lumeartisan
DIRECT_URL=postgresql://usuario:senha@localhost:5432/lumeartisan
JWT_SECRET=segredo-local-de-desenvolvimento
CORS_ORIGIN=http://localhost:5173
```

Em um PostgreSQL local sem pooler, `DATABASE_URL` e `DIRECT_URL` podem ter o
mesmo valor. Nunca versione o arquivo `.env`.

### 4. Aplicar as migrations

Crie o banco `lumeartisan` no PostgreSQL e execute:

```bash
bun run prisma:migrate:deploy
```

### 5. Criar o administrador

Defina as credenciais no `.env`:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=uma-senha-forte
SEED_ADMIN_FIRST_NAME=Admin
SEED_ADMIN_LAST_NAME=Sistema
```

Depois execute o seed:

```bash
bun run seed:admin
```

O script não aceita a senha padrão `admin123` quando executado com
`NODE_ENV=production`.

### 6. Iniciar a aplicação

```bash
bun run dev
```

Acesse `http://localhost:5173`.

| Serviço      | URL                                |
| ------------ | ---------------------------------- |
| Frontend     | `http://localhost:5173`            |
| API          | `http://localhost:3001`            |
| Health check | `http://localhost:3001/api/health` |

Se a porta `3001` já estiver ocupada por outro processo, escolha outra porta
para a API. O `API_PORT` configura o proxy do Vite e o `PORT` configura o
servidor Hono:

```bash
API_PORT=3002 PORT=3002 bun run dev
```

Nesse caso, o health check ficará disponível em
`http://localhost:3002/api/health`.

## Comandos úteis

```bash
bun run dev                    # Frontend e backend em modo watch
bun run dev:client             # Somente o frontend
bun run dev:server             # Somente o backend
bun run build                  # Prisma, typecheck e build do frontend
bun run preview                # Preview do build Vite
bun run lint                   # ESLint
bun run format:check           # Verificação do Prettier
bun run test                   # Testes unitários de frontend e API
bun run test:integration       # Testes de integração
bun run test:full              # Suíte completa
bun run prisma:generate        # Regenera o Prisma Client
bun run prisma:migrate:deploy  # Aplica migrations existentes
bun run seed:admin             # Cria o administrador inicial
```

Para executar os testes de frontend pela primeira vez, instale o navegador:

```bash
bun run test:browser:install
```

## Variáveis de ambiente

| Variável                | Obrigatória | Uso                                                       |
| ----------------------- | ----------- | --------------------------------------------------------- |
| `DATABASE_URL`          | Sim         | Conexão principal do Prisma; use URL pooled em serverless |
| `DIRECT_URL`            | Sim         | Conexão direta para migrations e introspecção             |
| `JWT_SECRET`            | Produção    | Segredo para assinar tokens JWT                           |
| `CORS_ORIGIN`           | Recomendada | Origins permitidas, separadas por vírgula                 |
| `SEED_ADMIN_EMAIL`      | Seed        | E-mail do administrador inicial                           |
| `SEED_ADMIN_PASSWORD`   | Seed        | Senha do administrador inicial                            |
| `SEED_ADMIN_FIRST_NAME` | Seed        | Nome do administrador inicial                             |
| `SEED_ADMIN_LAST_NAME`  | Seed        | Sobrenome do administrador inicial                        |

Em desenvolvimento, o backend usa um segredo JWT local de fallback. Em
produção, `JWT_SECRET` é obrigatório e não possui fallback.

## Deploy na Vercel

O deploy utiliza o modelo same-origin:

```text
Vercel
├── dist/                     Frontend Vite estático
└── api/[[...route]].ts       API Hono em Function Node.js
    └── Neon PostgreSQL
```

### 1. Criar o banco no Neon

Crie um projeto em [Neon](https://neon.tech/) e obtenha duas URLs:

- URL pooled para `DATABASE_URL`
- URL direta para `DIRECT_URL`

A URL pooled deve ser usada pelas requisições da aplicação para evitar excesso
de conexões em funções serverless.

### 2. Configurar o projeto Vercel

Importe o repositório na Vercel. O `bun.lock` permite a detecção automática do
Bun. Configure estas variáveis no ambiente **Production**:

```text
DATABASE_URL=<url-pooled-do-neon>
DIRECT_URL=<url-direta-do-neon>
JWT_SECRET=<segredo-aleatorio-forte>
CORS_ORIGIN=https://seu-dominio.vercel.app
PUPPETEER_SKIP_DOWNLOAD=true
```

O arquivo `vercel.json` já configura:

- Build com `prisma generate`, TypeScript e Vite
- Saída estática em `dist/`
- Fallback da SPA para as rotas do TanStack Router
- Function Hono com runtime `nodejs`
- Limite de 10 segundos compatível com o plano Hobby

### 3. Aplicar as migrations

Adicione `DATABASE_URL` e `DIRECT_URL` como secrets do repositório no GitHub.
Depois, no GitHub:

1. Abra a aba **Actions**.
2. Selecione **Deploy Database Migrations**.
3. Clique em **Run workflow**.

As migrations não são executadas durante o cold start nem dentro de uma
requisição HTTP.

### 4. Criar o administrador de produção

O seed não deve ser executado durante o build ou dentro de uma Function da
Vercel. Execute-o uma única vez, a partir de uma máquina confiável, usando as
variáveis do ambiente **Production**.

Instale e autentique a CLI da Vercel e associe o diretório local ao projeto:

```bash
npm i -g vercel
vercel login
vercel link
```

A forma recomendada é executar o seed sem salvar as variáveis de produção em
um arquivo local:

```bash
SEED_ADMIN_EMAIL='admin@example.com' \
SEED_ADMIN_PASSWORD='senha-forte' \
SEED_ADMIN_FIRST_NAME='Admin' \
SEED_ADMIN_LAST_NAME='Sistema' \
vercel env run -e production -- bun run seed:admin
```

Como alternativa, baixe as variáveis de produção para um arquivo local:

```bash
vercel env pull --environment=production .env.production.local

set -a
source .env.production.local
set +a

SEED_ADMIN_EMAIL='admin@example.com' \
SEED_ADMIN_PASSWORD='senha-forte' \
SEED_ADMIN_FIRST_NAME='Admin' \
SEED_ADMIN_LAST_NAME='Sistema' \
bun run seed:admin
```

O arquivo `.env.production.local` é ignorado pelo Git e não deve ser
versionado. Não use `admin123` em um ambiente exposto. Se o e-mail informado
já existir, o seed não cria um usuário duplicado.

### 5. Verificar o deploy

Depois do deploy, valide:

1. `GET https://seu-dominio.vercel.app/api/health`
2. Login pelo frontend
3. Acesso à sessão em `/api/auth/me`
4. Renovação do token em `/api/auth/refresh`
5. Geração de uma fatura PDF

## Estrutura do projeto

```text
api/                    Entrypoint serverless da Vercel
prisma/                 Schema e migrations do PostgreSQL
scripts/                Scripts operacionais, incluindo seed do admin
server/src/app.ts       Aplicação Hono reutilizável
server/src/index.ts     Servidor local long-running
server/src/lib/         Prisma, autenticação, estoque, preço e PDF
server/src/routes/      Rotas da API
src/                    Frontend React e rotas do TanStack Router
vercel.json             Configuração de build e roteamento da Vercel
```

Os módulos de domínio mais importantes são:

- Stock Ledger: saldo e movimentações de estoque
- Pricing: custo, margem e formação de preço
- Query Keys Registry: chaves centralizadas do React Query
- useEntityMutation: padrão de mutações do frontend

## Testes

Os testes de API rodam sem banco externo usando mocks e fixtures. Os testes de
integração precisam de um banco configurado em `DATABASE_URL_TEST`.

```bash
bun run test:api
bun run test:unit
bun run test:integration
```

Antes de abrir um pull request, execute também:

```bash
bun run lint
bun run build
bun run test
```

## Limitações conhecidas

- O rate limit de login ainda é mantido em memória. Em múltiplas functions da
  Vercel, a proteção não é compartilhada entre instâncias.
- O PDF usa Chromium serverless e pode exceder os 10 segundos do plano Hobby
  em cold starts. Se isso ocorrer, avalie `@sparticuz/chromium-min`, um serviço
  externo de browser ou um backend long-running.
- O seed é uma operação manual e não deve ser executado no boot da aplicação.
- Migrations devem ser executadas pelo workflow de banco, nunca durante uma
  requisição da API.

## Licença

Este projeto está disponível sob a licença [MIT](LICENSE).
