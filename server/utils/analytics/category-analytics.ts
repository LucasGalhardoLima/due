import type { Prisma } from '@prisma/client'
import { moneyToCents } from '../money'

type MoneyAmount = number | Prisma.Decimal

/** Aggregate installment amounts by category name */
export function aggregateByCategory(
  installments: { amount: MoneyAmount; transaction: { category: { name: string } } }[],
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const inst of installments) {
    const name = inst.transaction.category.name
    result[name] = (result[name] || 0) + moneyToCents(inst.amount) / 100
  }
  return result
}

/** Sum installment amounts to a total in reais */
export function sumInstallmentAmounts(
  installments: { amount: MoneyAmount }[],
): number {
  return installments.reduce((acc, inst) => acc + moneyToCents(inst.amount) / 100, 0)
}
