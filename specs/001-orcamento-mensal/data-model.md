# Data Model: Orcamento Mensal (Monthly Budget)

**Date**: 2026-02-11

## New Entities

### Income

Represents a user's income source. Supports recurring (monthly) and one-time entries.

```prisma
model Income {
  id          String   @id @default(uuid())
  description String   // e.g., "Salario", "Freelance", "Bonus"
  amount      Decimal  @db.Decimal(14, 2)
  isRecurring Boolean  @default(true)  // true = repeats monthly
  month       Int      // 1-12 (month this income applies to)
  year        Int      // 2026, etc.
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId, month, year])
}
```

**Validation rules**:
- `amount` MUST be > 0
- `month` MUST be 1-12
- `year` MUST be >= 2020
- `description` MUST be non-empty, max 100 characters
- `userId` is set server-side from auth (never from client)

**Behavior**:
- When `isRecurring` is true, the system auto-propagates this income to future months when queried (computed, not stored). The stored record represents the month it was created.
- Editing a recurring income updates the source record; it applies from the current month forward.
- Deleting a recurring income stops it from appearing in future months.

### CategoryBudget

Represents a monthly spending limit for a specific category. Persists until manually changed.

```prisma
model CategoryBudget {
  id         String   @id @default(uuid())
  amount     Decimal  @db.Decimal(14, 2) // Monthly limit
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  userId     String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([categoryId, userId]) // One budget per category per user
}
```

**Validation rules**:
- `amount` MUST be >= 0 (0 means "tracking only, no limit")
- `categoryId` MUST reference an existing category owned by the same user
- One budget per category per user (upsert pattern)

**Behavior**:
- Budget limits persist month-to-month (not per-month). The same limit applies every month until the user changes it.
- When a category is deleted, its CategoryBudget is cascade-deleted.
- Setting amount to 0 or deleting the record removes the limit (spending still shown, no threshold warnings).

## Existing Entity Changes

### Category (add relation)

```prisma
model Category {
  // ... existing fields ...
  budget CategoryBudget? // Add optional relation
}
```

## Computed Aggregations (not persisted)

### BudgetSummary

Calculated per API request for a given month/year:

```typescript
interface BudgetSummary {
  month: number
  year: number
  totalIncome: number          // Sum of all income sources for this month
  totalSpending: number        // Sum of all installments due this month
  remaining: number            // totalIncome - totalSpending
  savingsRate: number          // (remaining / totalIncome) * 100
  incomes: IncomeEntry[]       // Individual income sources
  categories: CategoryBudgetStatus[]  // Per-category breakdown
}

interface IncomeEntry {
  id: string
  description: string
  amount: number
  isRecurring: boolean
}

interface CategoryBudgetStatus {
  categoryId: string
  categoryName: string
  budgetLimit: number | null   // null = no limit set
  actualSpending: number       // From installments this month
  percentage: number           // (actual / limit) * 100
  status: 'under' | 'warning' | 'exceeded' | 'no-limit'
}
```

**Status thresholds**:
- `under`: < 80% of limit
- `warning`: >= 80% and <= 100%
- `exceeded`: > 100%
- `no-limit`: no CategoryBudget set

## Entity Relationship Diagram

```
User (userId)
  ├── Income[] (1:many)
  ├── Category[]
  │     └── CategoryBudget? (1:1 per user)
  ├── CreditCard[]
  │     └── Transaction[]
  │           └── Installment[] ──→ Used for "actual spending"
  └── Invoice[]
```

## Migration Notes

- Two new tables: `Income` and `CategoryBudget`
- One new relation on `Category` (non-breaking, optional)
- No data migration needed (new feature, no existing data)
- Rollback: drop both tables and remove Category relation
