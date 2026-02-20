import { z } from 'zod'
import { endOfMonth } from 'date-fns'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

const querySchema = z.object({
  month: z.string(),
  year: z.string(),
})

async function computeMonthSummary(userId: string, month: number, year: number) {
  // Fetch incomes
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      OR: [
        { month, year },
        {
          isRecurring: true,
          OR: [
            { year: { lt: year } },
            { year, month: { lte: month } },
          ],
        },
      ],
    },
  })

  const totalIncome = incomes.reduce((sum, inc) => sum + moneyToNumber(inc.amount), 0)

  // Fetch installments
  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)

  const installments = await prisma.installment.findMany({
    where: {
      dueDate: { gte: startDate, lte: endDate },
      transaction: { userId },
    },
    include: {
      transaction: { include: { category: true } },
    },
  })

  const totalSpending = installments.reduce(
    (sum, inst) => sum + moneyToNumber(inst.amount),
    0
  )

  // Per-category spending
  const categoryMap: Record<string, { name: string; spending: number }> = {}
  for (const inst of installments) {
    const cat = inst.transaction.category
    if (!categoryMap[cat.id]) {
      categoryMap[cat.id] = { name: cat.name, spending: 0 }
    }
    categoryMap[cat.id].spending += moneyToNumber(inst.amount)
  }

  const remaining = Math.round((totalIncome - totalSpending) * 100) / 100
  const savingsRate = totalIncome > 0 ? Math.round((remaining / totalIncome) * 100) : 0

  return {
    month,
    year,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalSpending: Math.round(totalSpending * 100) / 100,
    remaining,
    savingsRate,
    categoryMap,
  }
}

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query params' })
  }

  const month = parseInt(result.data.month)
  const year = parseInt(result.data.year)

  // Compute current and previous month
  const current = await computeMonthSummary(userId, month, year)

  let prevMonth = month - 1
  let prevYear = year
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }

  const previous = await computeMonthSummary(userId, prevMonth, prevYear)
  const hasPreviousData = previous.totalIncome > 0 || previous.totalSpending > 0

  // Fetch category budgets
  const categoryBudgets = await prisma.categoryBudget.findMany({
    where: { userId },
  })
  const budgetMap = Object.fromEntries(
    categoryBudgets.map(cb => [cb.categoryId, moneyToNumber(cb.amount)])
  )

  // Build category comparison
  const allCategoryIds = new Set([
    ...Object.keys(current.categoryMap),
    ...Object.keys(previous.categoryMap),
  ])

  const categoryComparison = Array.from(allCategoryIds).map(categoryId => {
    const curr = current.categoryMap[categoryId]
    const prev = previous.categoryMap[categoryId]
    const currentSpending = curr ? Math.round(curr.spending * 100) / 100 : 0
    const previousSpending = prev ? Math.round(prev.spending * 100) / 100 : null

    let trend: 'up' | 'down' | 'stable' | 'new' = 'new'
    let changePercent: number | null = null

    if (previousSpending !== null && previousSpending > 0) {
      changePercent = Math.round(((currentSpending - previousSpending) / previousSpending) * 100)
      if (changePercent > 5) trend = 'up'
      else if (changePercent < -5) trend = 'down'
      else trend = 'stable'
    }

    return {
      categoryId,
      categoryName: curr?.name || prev?.name || 'Unknown',
      currentSpending,
      previousSpending,
      budgetLimit: budgetMap[categoryId] ?? null,
      trend,
      changePercent,
    }
  })

  // Compute trends
  let trends = null
  if (hasPreviousData) {
    const incomeChange = previous.totalIncome > 0
      ? Math.round(((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100)
      : 0
    const spendingChange = previous.totalSpending > 0
      ? Math.round(((current.totalSpending - previous.totalSpending) / previous.totalSpending) * 100)
      : 0

    trends = {
      incomeChange,
      spendingChange,
      savingsRateChange: current.savingsRate - previous.savingsRate,
    }
  }

  return {
    current: {
      month: current.month,
      year: current.year,
      totalIncome: current.totalIncome,
      totalSpending: current.totalSpending,
      remaining: current.remaining,
      savingsRate: current.savingsRate,
    },
    previous: hasPreviousData
      ? {
          month: previous.month,
          year: previous.year,
          totalIncome: previous.totalIncome,
          totalSpending: previous.totalSpending,
          remaining: previous.remaining,
          savingsRate: previous.savingsRate,
        }
      : null,
    trends,
    categoryComparison: categoryComparison.sort((a, b) => b.currentSpending - a.currentSpending),
  }
})
