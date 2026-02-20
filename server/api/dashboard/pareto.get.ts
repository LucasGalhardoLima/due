import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns'
import { moneyToCents } from '../../utils/money'
import { getCache, setCache } from '../../utils/ai-cache'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'paretoAnalysis'))

  const now = new Date()

  const cacheKey = `dashboard:pareto:${userId}:${getYear(now)}-${getMonth(now) + 1}`
  const cached = getCache<ReturnType<typeof buildParetoResult>>(cacheKey)
  if (cached) return cached
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(now)
  
  // Get all installments for current month with their transaction's category
  const installments = await prisma.installment.findMany({
    where: {
      transaction: {
        userId
      },
      dueDate: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      transaction: {
        include: {
          category: true
        }
      }
    }
  })
  
  // Group by category
  const categoryTotals = new Map<string, { name: string; totalCents: number; color: string }>()
  let grandTotalCents = 0
  
  for (const inst of installments) {
    const catId = inst.transaction.categoryId
    const catName = inst.transaction.category.name
    const catColor = inst.transaction.category.color || '#231651'

    const existing = categoryTotals.get(catId) || { name: catName, totalCents: 0, color: catColor }
    existing.totalCents += moneyToCents(inst.amount)
    categoryTotals.set(catId, existing)
    grandTotalCents += moneyToCents(inst.amount)
  }
  
  // Convert to array and sort descending
  const categories = Array.from(categoryTotals.values())
    .map(cat => {
      return {
        name: cat.name,
        total: Math.round((cat.totalCents / 100) * 100) / 100,
        percentage: grandTotalCents > 0 ? Math.round(((cat.totalCents / grandTotalCents) * 100) * 100) / 100 : 0,
        color: cat.color
      }
    })
    .sort((a, b) => b.total - a.total)
  
  const result = buildParetoResult(categories, grandTotalCents, now)
  setCache(cacheKey, result, 5 * 60 * 1000) // 5 min TTL
  return result
})

function buildParetoResult(
  categories: { name: string; total: number; percentage: number; color: string }[],
  grandTotalCents: number,
  now: Date,
) {
  return {
    categories,
    grandTotal: Math.round((grandTotalCents / 100) * 100) / 100,
    month: getMonth(now) + 1,
    year: getYear(now),
  }
}
