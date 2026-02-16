import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, addMonths, getMonth, getYear } from 'date-fns'
import { TIER_LIMITS, type Tier } from '#shared/tier-config'
import { getCache, setCache } from '../../utils/ai-cache'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  const now = new Date()

  const cacheKey = `dashboard:projection:${userId}:${getYear(now)}-${getMonth(now) + 1}`
  const cached = getCache<{ projections: unknown[] }>(cacheKey)
  if (cached) return cached

  const projections = []

  const maxMonths = Math.min(TIER_LIMITS[appUser.tier as Tier].projectionMonths, 24)
  const projectionCount = Math.min(3, maxMonths)

  const rangeStart = startOfMonth(addMonths(now, 1))
  const rangeEnd = endOfMonth(addMonths(now, projectionCount))

  // Use groupBy to aggregate on the DB instead of fetching all rows
  const grouped = await prisma.installment.groupBy({
    by: ['dueDate'],
    where: {
      transaction: { userId },
      dueDate: { gte: rangeStart, lte: rangeEnd }
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  // Re-aggregate by month (groupBy gives per-dueDate, we need per-month)
  const byMonth = new Map<string, { total: number; count: number }>()
  for (const row of grouped) {
    const d = row.dueDate
    const key = `${getYear(d)}-${getMonth(d)}`
    const existing = byMonth.get(key) || { total: 0, count: 0 }
    existing.total += row._sum.amount?.toNumber() ?? 0
    existing.count += row._count.id
    byMonth.set(key, existing)
  }

  for (let i = 1; i <= projectionCount; i++) {
    const targetDate = addMonths(now, i)
    const key = `${getYear(targetDate)}-${getMonth(targetDate)}`
    const entry = byMonth.get(key) || { total: 0, count: 0 }

    projections.push({
      month: getMonth(targetDate) + 1,
      year: getYear(targetDate),
      total: Math.round(entry.total * 100) / 100,
      installmentsCount: entry.count
    })
  }

  const result = { projections }
  setCache(cacheKey, result, 5 * 60 * 1000) // 5 min TTL
  return result
})
