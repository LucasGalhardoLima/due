# Due

Finanças reimaginadas para quem vive no crédito. O Due é um app de gestão financeira pessoal focado em cartões de crédito, com projeção de faturas, parcelamentos e insights por IA.

## Stack

- Nuxt 4 + Vue 3 + TypeScript
- Tailwind CSS + shadcn-vue primitives (reka-ui)
- Prisma + PostgreSQL (Neon)
- Clerk (autenticação)
- Vercel AI SDK (AI Gateway)
- Vitest + Playwright
 - Vercel Cron (opcional)

## Setup

1. Instale dependências:

```bash
npm install
```

2. Crie um arquivo `.env` com as variáveis de `.env.example`.

3. Gere o client do Prisma e rode as migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

4. Suba o app:

```bash
npm run dev
```

O app roda em `http://localhost:3000`.

## Scripts Úteis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview da build
- `npm run test` — testes unitários
- `npm run test:integration` — testes de integração
- `npm run test:e2e` — Playwright
- `npm run lint` — lint

## Estrutura

- `app/` — UI e rotas Nuxt
- `server/api/` — rotas backend (H3)
- `server/utils/` — helpers (Prisma, IA, finanças)
- `prisma/` — schema e seed
- `tests/` — unit, integration e e2e

## Observações

- O PWA inicia em `/` para respeitar o fluxo de autenticação.
- As rotas de IA usam `AI_GATEWAY_API_KEY` via Vercel AI Gateway.
- Clerk requer `NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `NUXT_CLERK_SECRET_KEY`.
- A rota de cron exige `CRON_SECRET` no header `Authorization: Bearer <secret>`.
