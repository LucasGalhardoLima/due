import type { Prisma } from '@prisma/client'
import { moneyToCents } from '../money'

type MoneyAmount = number | Prisma.Decimal

/** Format a Date into a YYYY-MM string key */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Group installments by month, returning totals and optional per-category breakdown */
export function groupInstallmentsByMonth(
  installments: { amount: MoneyAmount; dueDate: Date; transaction: { category: { name: string } } }[],
  monthKeys: string[],
): Record<string, { total: number; categories: Record<string, number>; count: number }> {
  const data: Record<string, { total: number; categories: Record<string, number>; count: number }> = {}

  for (const key of monthKeys) {
    data[key] = { total: 0, categories: {}, count: 0 }
  }

  for (const inst of installments) {
    const key = monthKey(new Date(inst.dueDate))
    if (!data[key]) continue

    const amount = moneyToCents(inst.amount) / 100
    data[key].total += amount
    data[key].count++

    const categoryName = inst.transaction.category.name
    data[key].categories[categoryName] = (data[key].categories[categoryName] || 0) + amount
  }

  return data
}
