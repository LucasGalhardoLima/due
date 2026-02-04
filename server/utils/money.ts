import { Prisma } from '@prisma/client'

type MoneyInput = number | Prisma.Decimal

function toDecimal(amount: MoneyInput): Prisma.Decimal {
  return amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount)
}

export function moneyToCents(amount: MoneyInput): number {
  const dec = toDecimal(amount)
  return dec.mul(100).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber()
}

export function moneyFromCents(cents: number): Prisma.Decimal {
  return new Prisma.Decimal(cents).div(100)
}

export function moneyToNumber(amount: MoneyInput): number {
  return toDecimal(amount)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber()
}

export function sumMoneyToCents(amounts: MoneyInput[]): number {
  return amounts.reduce((acc, amount) => acc + moneyToCents(amount), 0)
}

export function serializeDecimals(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) {
    return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber()
  }
  if (value instanceof Date) return value
  if (Array.isArray(value)) return value.map(serializeDecimals)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return Object.fromEntries(entries.map(([key, val]) => [key, serializeDecimals(val)]))
  }
  return value
}
