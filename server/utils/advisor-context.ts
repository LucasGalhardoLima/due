import prisma from './prisma'
import { subDays, startOfDay, endOfDay, addMonths, setDate, isAfter } from 'date-fns'
import { moneyToCents, moneyToNumber } from './money'
import { totalCardLimit, totalCardBudget } from './analytics/card-aggregates'
import { sumInstallmentAmounts } from './analytics/category-analytics'

/** Strip control chars and truncate user-supplied text before embedding in AI prompts */
function sanitizeForPrompt(text: string, maxLength = 50): string {
  return text.replace(/[^\p{L}\p{N}\s\-_.,&()]/gu, '').trim().slice(0, maxLength)
}

export interface BudgetMetrics {
  totalMonthlyIncome: number
  savingsRate: number
  budgetUtilizationOverall: number
  overBudgetCategories: Array<{
    name: string
    overagePercent: number
  }>
}

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
  budgetMetrics: BudgetMetrics | null
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
  const last7DaysTotal = sumInstallmentAmounts(last7DaysInstallments)
  const byCategory: Record<string, number> = {}
  for (const inst of last7DaysInstallments) {
    const catName = sanitizeForPrompt(inst.transaction.category.name)
    byCategory[catName] = (byCategory[catName] || 0) + (moneyToCents(inst.amount) / 100)
  }

  // Calculate same period last month
  const samePeriodTotal = sumInstallmentAmounts(samePeriodInstallments)

  // Calculate change percent
  const changePercent = samePeriodTotal > 0
    ? ((last7DaysTotal - samePeriodTotal) / samePeriodTotal) * 100
    : 0

  // Calculate budget utilization
  const currentMonthTotal = sumInstallmentAmounts(currentMonthInstallments)
  const totalLimit = totalCardLimit(userCards)
  const totalBudget = totalCardBudget(userCards)
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

  // Gather budget metrics (income + category budgets)
  let budgetMetrics: BudgetMetrics | null = null
  try {
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const [incomes, categoryBudgets, catSpendingInstallments] = await Promise.all([
      prisma.income.findMany({
        where: {
          userId,
          OR: [
            { month: currentMonth, year: currentYear },
            {
              isRecurring: true,
              OR: [
                { year: { lt: currentYear } },
                { year: currentYear, month: { lte: currentMonth } },
              ],
            },
          ],
        },
      }),
      prisma.categoryBudget.findMany({
        where: { userId },
        include: { category: { select: { name: true } } },
      }),
      prisma.installment.findMany({
        where: {
          dueDate: { gte: currentMonthStart, lte: currentMonthEnd },
          transaction: { userId },
        },
        include: { transaction: { include: { category: true } } },
      }),
    ])

    const totalMonthlyIncome = incomes.reduce((sum, inc) => sum + moneyToNumber(inc.amount), 0)

    if (totalMonthlyIncome > 0 || categoryBudgets.length > 0) {

      const catSpending: Record<string, number> = {}
      for (const inst of catSpendingInstallments) {
        const catId = inst.transaction.category.id
        catSpending[catId] = (catSpending[catId] || 0) + moneyToNumber(inst.amount)
      }

      const totalSpending = Object.values(catSpending).reduce((s, v) => s + v, 0)
      const remaining = totalMonthlyIncome - totalSpending
      const savingsRate = totalMonthlyIncome > 0 ? (remaining / totalMonthlyIncome) * 100 : 0
      const budgetUtilizationOverall = totalMonthlyIncome > 0 ? (totalSpending / totalMonthlyIncome) * 100 : 0

      // Find top 3 over-budget categories
      const overBudgetCategories = categoryBudgets
        .filter(cb => {
          const spent = catSpending[cb.categoryId] || 0
          const limit = moneyToNumber(cb.amount)
          return limit > 0 && spent > limit
        })
        .map(cb => ({
          name: cb.category.name,
          overagePercent: Math.round(
            (((catSpending[cb.categoryId] || 0) - moneyToNumber(cb.amount)) / moneyToNumber(cb.amount)) * 100
          ),
        }))
        .sort((a, b) => b.overagePercent - a.overagePercent)
        .slice(0, 3)

      budgetMetrics = {
        totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
        savingsRate: Math.round(savingsRate),
        budgetUtilizationOverall: Math.round(budgetUtilizationOverall),
        overBudgetCategories,
      }
    }
  } catch {
    // Budget metrics are optional — don't fail the whole context
  }

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
    healthScore,
    budgetMetrics
  }
}
