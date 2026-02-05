import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, addMonths, getMonth, getYear } from 'date-fns'
import { moneyToCents } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const now = new Date()
  const projections = []

  const rangeStart = startOfMonth(addMonths(now, 1))
  const rangeEnd = endOfMonth(addMonths(now, 3))

  const installments = await prisma.installment.findMany({
    where: {
      transaction: { userId },
      dueDate: { gte: rangeStart, lte: rangeEnd }
    }
  })

  const byMonth = new Map<string, { totalCents: number; count: number }>()
  for (const inst of installments) {
    const d = inst.dueDate
    const key = `${getYear(d)}-${getMonth(d)}`
    const existing = byMonth.get(key) || { totalCents: 0, count: 0 }
    existing.totalCents += moneyToCents(inst.amount)
    existing.count += 1
    byMonth.set(key, existing)
  }

  for (let i = 1; i <= 3; i++) {
    const targetDate = addMonths(now, i)
    const key = `${getYear(targetDate)}-${getMonth(targetDate)}`
    const entry = byMonth.get(key) || { totalCents: 0, count: 0 }

    projections.push({
      month: getMonth(targetDate) + 1,
      year: getYear(targetDate),
      total: entry.totalCents / 100,
      installmentsCount: entry.count
    })
  }
  
  return { projections }
})
