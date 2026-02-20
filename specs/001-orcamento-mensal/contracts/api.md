# API Contracts: Orcamento Mensal

**Date**: 2026-02-11

## Income Endpoints

### GET /api/income

Fetch income entries for a given month/year. Recurring incomes from previous months are included.

**Query params**:
```typescript
{
  month: string  // 1-12 (required)
  year: string   // e.g., "2026" (required)
}
```

**Response** `200`:
```typescript
{
  incomes: Array<{
    id: string
    description: string
    amount: number
    isRecurring: boolean
    month: number
    year: number
    createdAt: string
  }>
  totalIncome: number
}
```

### POST /api/income

Create a new income entry.

**Body**:
```typescript
{
  description: string   // max 100 chars
  amount: number        // > 0
  isRecurring: boolean  // default: true
  month: number         // 1-12
  year: number          // >= 2020
}
```

**Response** `201`: Created income object.

### PUT /api/income/:id

Update an existing income entry.

**Body**: Same as POST (all fields optional except at least one).

**Response** `200`: Updated income object.

**Errors**: `404` if not found or not owned by user.

### DELETE /api/income/:id

Delete an income entry.

**Response** `200`: `{ success: true }`

**Errors**: `404` if not found or not owned by user.

---

## Category Budget Endpoints

### GET /api/category-budgets

Fetch all category budget limits for the authenticated user.

**Response** `200`:
```typescript
Array<{
  id: string
  amount: number
  categoryId: string
  category: {
    id: string
    name: string
    color: string | null
  }
}>
```

### PUT /api/category-budgets/:categoryId

Set or update the budget limit for a category (upsert).

**Body**:
```typescript
{
  amount: number  // >= 0
}
```

**Response** `200`: Upserted CategoryBudget object.

### DELETE /api/category-budgets/:categoryId

Remove the budget limit for a category.

**Response** `200`: `{ success: true }`

**Errors**: `404` if not found or not owned by user.

---

## Budget Summary Endpoint

### GET /api/budget/summary

Fetch the full budget overview for a month: income, spending, per-category breakdown.

**Query params**:
```typescript
{
  month: string  // 1-12 (required)
  year: string   // e.g., "2026" (required)
}
```

**Response** `200`:
```typescript
{
  month: number
  year: number
  totalIncome: number
  totalSpending: number
  remaining: number
  savingsRate: number  // percentage
  incomes: Array<{
    id: string
    description: string
    amount: number
    isRecurring: boolean
  }>
  categories: Array<{
    categoryId: string
    categoryName: string
    categoryColor: string | null
    budgetLimit: number | null
    actualSpending: number
    percentage: number
    status: 'under' | 'warning' | 'exceeded' | 'no-limit'
  }>
}
```

**Computation**:
1. Fetch all incomes for the month (including recurring from previous months)
2. Fetch all installments due in the month, grouped by category
3. Fetch all CategoryBudget records for the user
4. Join and compute status per category
5. Calculate totals

---

## Budget Report Endpoint

### GET /api/budget/report

Fetch month-over-month budget comparison report.

**Query params**:
```typescript
{
  month: string  // 1-12 (required)
  year: string   // e.g., "2026" (required)
}
```

**Response** `200`:
```typescript
{
  current: {
    month: number
    year: number
    totalIncome: number
    totalSpending: number
    remaining: number
    savingsRate: number
  }
  previous: {
    month: number
    year: number
    totalIncome: number
    totalSpending: number
    remaining: number
    savingsRate: number
  } | null  // null if no previous data
  trends: {
    incomeChange: number      // percentage
    spendingChange: number    // percentage
    savingsRateChange: number // percentage points
  } | null
  categoryComparison: Array<{
    categoryId: string
    categoryName: string
    currentSpending: number
    previousSpending: number | null
    budgetLimit: number | null
    trend: 'up' | 'down' | 'stable' | 'new'
    changePercent: number | null
  }>
}
```
