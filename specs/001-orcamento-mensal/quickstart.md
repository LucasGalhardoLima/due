# Quickstart: Orcamento Mensal

## Prerequisites

- Node.js 18+
- PostgreSQL database running (or Neon connection string)
- `.env` configured with `DATABASE_URL`

## Setup Steps

```bash
# 1. Switch to feature branch
git checkout 001-orcamento-mensal

# 2. Install dependencies (if new packages added)
npm install

# 3. Run Prisma migration (after schema changes)
npx prisma migrate dev --name add-income-and-category-budget

# 4. Generate Prisma client
npx prisma generate

# 5. Start dev server
npm run dev
```

## Verify Feature

1. Navigate to `http://localhost:3000/orcamento`
2. Add an income source (e.g., "Salario" R$5,500)
3. Set a category budget limit (e.g., "Alimentacao" R$800)
4. Verify the budget overview shows income vs spending breakdown
5. Check that categories with existing transactions show progress bars

## Test Data

If using demo mode, the onboarding seed already creates transactions with installments. After adding income and category budgets, the budget summary should reflect existing spending data.

## Key Routes

| Route | Description |
|-------|-------------|
| `/orcamento` | Budget overview page |
| `GET /api/income?month=2&year=2026` | Fetch incomes |
| `POST /api/income` | Create income |
| `GET /api/category-budgets` | Fetch category limits |
| `PUT /api/category-budgets/:categoryId` | Set category limit |
| `GET /api/budget/summary?month=2&year=2026` | Full budget summary |
| `GET /api/budget/report?month=2&year=2026` | Month-over-month report |

## Rollback

```bash
# Revert migration
npx prisma migrate reset

# Or manually drop tables
DROP TABLE IF EXISTS "CategoryBudget";
DROP TABLE IF EXISTS "Income";
```
