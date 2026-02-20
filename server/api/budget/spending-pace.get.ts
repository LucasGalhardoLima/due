import { z } from 'zod'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDaysInMonth } from 'date-fns'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

const querySchema = z.object({
  month: z.string(),
  year: z.string(),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query params' })
  }

  const month = parseInt(result.data.month)
  const year = parseInt(result.data.year)

  const startDate = startOfMonth(new Date(year, month - 1, 1))
  const endDate = endOfMonth(startDate)
  const daysInMonth = getDaysInMonth(startDate)

  // Fetch all installments for this month
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: { gte: startDate, lte: endDate },
      transaction: { userId },
    },
    select: {
      amount: true,
      dueDate: true,
    },
    orderBy: { dueDate: 'asc' },
  })

  // Fetch total budget (sum of all category budgets)
  const categoryBudgets = await prisma.categoryBudget.findMany({
    where: { userId },
    select: { amount: true },
  })

  const totalBudget = categoryBudgets.reduce(
    (sum, cb) => sum + moneyToNumber(cb.amount),
    0
  )

  // Group spending by day
  const dailySpending: Record<string, number> = {}
  for (const inst of installments) {
    const dayKey = format(inst.dueDate, 'yyyy-MM-dd')
    if (!dailySpending[dayKey]) dailySpending[dayKey] = 0
    dailySpending[dayKey] += moneyToNumber(inst.amount)
  }

  // Build cumulative daily data
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })
  let cumulative = 0

  const dataPoints = allDays.map((day, idx) => {
    const dayKey = format(day, 'yyyy-MM-dd')
    const daySpending = dailySpending[dayKey] || 0
    cumulative += daySpending

    // Linear pace: (totalBudget / daysInMonth) * (dayIndex + 1)
    const idealPace = totalBudget > 0
      ? Math.round(((totalBudget / daysInMonth) * (idx + 1)) * 100) / 100
      : 0

    return {
      date: dayKey,
      day: idx + 1,
      actual: Math.round(cumulative * 100) / 100,
      ideal: idealPace,
      daily: Math.round(daySpending * 100) / 100,
    }
  })

  return {
    month,
    year,
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalSpent: Math.round(cumulative * 100) / 100,
    dataPoints,
  }
})
