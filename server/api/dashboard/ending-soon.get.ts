import prisma from '../../utils/prisma'
import { addMonths, getMonth, getYear } from 'date-fns'
import { getCache, setCache } from '../../utils/ai-cache'

/**
 * Returns parcelamentos ending within the next 2 billing cycles.
 * "Ending" = the last installment dueDate falls within the window.
 * Returns the sum of per-month installment amounts that will free up.
 */
export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  const now = new Date()

  const cacheKey = `dashboard:ending-soon:${userId}:${getYear(now)}-${getMonth(now) + 1}`
  const cached = getCache<{ totalFreeing: number; count: number; items: unknown[] }>(cacheKey)
  if (cached) return cached

  const windowEnd = addMonths(now, 2)

  // Find parcelamentos (installmentsCount > 1) where the max installment
  // dueDate is within our window — meaning the parcelamento ends soon.
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      installmentsCount: { gt: 1 },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      installmentsCount: true,
      installments: {
        select: { dueDate: true, amount: true, number: true },
        orderBy: { number: 'desc' },
        take: 1, // only the last installment
      },
    },
  })

  const endingSoon = transactions.filter(tx => {
    const lastInst = tx.installments[0]
    if (!lastInst) return false
    return lastInst.dueDate >= now && lastInst.dueDate <= windowEnd
  })

  const items = endingSoon.map(tx => {
    const perMonth = Number(tx.amount) / tx.installmentsCount
    const lastInst = tx.installments[0]!
    return {
      id: tx.id,
      description: tx.description,
      perMonth: Math.round(perMonth * 100) / 100,
      endsAt: lastInst.dueDate.toISOString(),
      lastInstallmentNumber: lastInst.number,
      totalInstallments: tx.installmentsCount,
    }
  })

  const totalFreeing = items.reduce((sum, i) => sum + i.perMonth, 0)

  const result = {
    totalFreeing: Math.round(totalFreeing * 100) / 100,
    count: items.length,
    items: items.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()),
  }

  setCache(cacheKey, result, 5 * 60 * 1000)
  return result
})
