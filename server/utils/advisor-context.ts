import prisma from './prisma'
import { subDays, startOfDay, endOfDay, addMonths, setDate, isAfter } from 'date-fns'

export interface AdvisorContext {
  recentTransactions: {
    last7Days: {
      total: number
      count: number
      byCategory: Record<string, number>
    }
    samePeriodLastMonth: {
      total: number
      count: number
    }
    changePercent: number
  }
  budgetUtilization: {
    current: number
    limit: number
    budget: number | null
    utilizationPercent: number
  }
  invoiceTimeline: {
    daysUntilClosing: number
    closingDate: Date
  }
  healthScore: number // 0-100 simplified calculation
}

export async function gatherAdvisorContext(
  userId: string,
  cardId?: string
): Promise<AdvisorContext> {
  const now = new Date()
  const today = startOfDay(now)

  // Date ranges for last 7 days
  const last7DaysStart = startOfDay(subDays(now, 7))
  const last7DaysEnd = endOfDay(now)

  // Same period last month
  const lastMonth = subDays(now, 30)
  const samePeriodLastMonthStart = startOfDay(subDays(lastMonth, 7))
  const samePeriodLastMonthEnd = endOfDay(lastMonth)

  // Current month range for budget utilization
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Build card filter
  const cardFilter = cardId
    ? { transaction: { userId, cardId } }
    : { transaction: { userId } }

  // Parallel queries for efficiency
  const [
    last7DaysInstallments,
    samePeriodInstallments,
    currentMonthInstallments,
    userCards
  ] = await Promise.all([
    // Last 7 days installments
    prisma.installment.findMany({
      where: {
        dueDate: {
          gte: last7DaysStart,
          lte: last7DaysEnd
        },
        ...cardFilter
      },
      include: {
        transaction: {
          include: {
            category: { select: { name: true } }
          }
        }
      }
    }),

    // Same period last month
    prisma.installment.findMany({
      where: {
        dueDate: {
          gte: samePeriodLastMonthStart,
          lte: samePeriodLastMonthEnd
        },
        ...cardFilter
      }
    }),

    // Current month total for budget utilization
    prisma.installment.findMany({
      where: {
        dueDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        },
        ...cardFilter
      }
    }),

    // User cards for limit/budget
    cardId
      ? prisma.creditCard.findMany({ where: { userId, id: cardId } })
      : prisma.creditCard.findMany({ where: { userId } })
  ])

  // Calculate last 7 days metrics
  const last7DaysTotal = last7DaysInstallments.reduce((acc, inst) => acc + inst.amount, 0)
  const byCategory: Record<string, number> = {}
  for (const inst of last7DaysInstallments) {
    const catName = inst.transaction.category.name
    byCategory[catName] = (byCategory[catName] || 0) + inst.amount
  }

  // Calculate same period last month
  const samePeriodTotal = samePeriodInstallments.reduce((acc, inst) => acc + inst.amount, 0)

  // Calculate change percent
  const changePercent = samePeriodTotal > 0
    ? ((last7DaysTotal - samePeriodTotal) / samePeriodTotal) * 100
    : 0

  // Calculate budget utilization
  const currentMonthTotal = currentMonthInstallments.reduce((acc, inst) => acc + inst.amount, 0)
  const totalLimit = userCards.reduce((acc, c) => acc + c.limit, 0)
  const totalBudget = userCards.reduce((acc, c) => acc + (c.budget || 0), 0)
  const utilizationBase = totalBudget > 0 ? totalBudget : totalLimit
  const utilizationPercent = utilizationBase > 0
    ? (currentMonthTotal / utilizationBase) * 100
    : 0

  // Calculate closing date (use first card's closing day or default to 25)
  const closingDay = userCards[0]?.closingDay || 25
  let closingDate = setDate(now, closingDay)

  // If closing date is in the past, move to next month
  if (isAfter(today, closingDate)) {
    closingDate = addMonths(closingDate, 1)
  }

  const daysUntilClosing = Math.ceil(
    (closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate health score (0-100)
  // Factors: utilization (40%), spending trend (30%), days to closing buffer (30%)
  let healthScore = 100

  // Utilization penalty (0-40 points)
  if (utilizationPercent >= 100) {
    healthScore -= 40
  } else if (utilizationPercent >= 80) {
    healthScore -= 30
  } else if (utilizationPercent >= 60) {
    healthScore -= 15
  }

  // Spending trend penalty (0-30 points)
  if (changePercent > 50) {
    healthScore -= 30
  } else if (changePercent > 20) {
    healthScore -= 15
  } else if (changePercent < -20) {
    healthScore += 10 // Bonus for reducing spending
  }

  // Days to closing buffer (0-30 points)
  if (daysUntilClosing <= 3 && utilizationPercent > 80) {
    healthScore -= 30
  } else if (daysUntilClosing <= 5 && utilizationPercent > 70) {
    healthScore -= 15
  }

  healthScore = Math.max(0, Math.min(100, healthScore))

  return {
    recentTransactions: {
      last7Days: {
        total: last7DaysTotal,
        count: last7DaysInstallments.length,
        byCategory
      },
      samePeriodLastMonth: {
        total: samePeriodTotal,
        count: samePeriodInstallments.length
      },
      changePercent
    },
    budgetUtilization: {
      current: currentMonthTotal,
      limit: totalLimit,
      budget: totalBudget > 0 ? totalBudget : null,
      utilizationPercent
    },
    invoiceTimeline: {
      daysUntilClosing,
      closingDate
    },
    healthScore
  }
}
