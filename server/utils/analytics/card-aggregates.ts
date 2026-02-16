import type { CreditCard } from '@prisma/client'
import { moneyToNumber } from '../money'

/** Sum the `limit` field across all cards */
export function totalCardLimit(cards: CreditCard[]): number {
  return cards.reduce((acc, c) => acc + moneyToNumber(c.limit), 0)
}

/** Sum the optional `budget` field across all cards */
export function totalCardBudget(cards: CreditCard[]): number {
  return cards.reduce((acc, c) => acc + (c.budget ? moneyToNumber(c.budget) : 0), 0)
}
