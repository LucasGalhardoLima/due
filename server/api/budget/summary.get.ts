import { z } from 'zod'
import { endOfMonth } from 'date-fns'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'
import { createNotification } from '../../utils/notifications'

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

  // 1. Fetch incomes (specific month + recurring from prior months)
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
    orderBy: { createdAt: 'desc' },
  })

  // 2. Fetch installments for this month grouped by category
  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)

  const installments = await prisma.installment.findMany({
    where: {
      dueDate: { gte: startDate, lte: endDate },
      transaction: { userId },
    },
    include: {
      transaction: {
        include: { category: true },
      },
    },
  })

  // 3. Fetch all category budgets for user
  const categoryBudgets = await prisma.categoryBudget.findMany({
    where: { userId },
    include: { category: true },
  })

  // 4. Build per-category spending map
  const categorySpending: Record<string, { name: string; color: string | null; emoji: string | null; amount: number }> = {}

  for (const inst of installments) {
    const cat = inst.transaction.category
    if (!categorySpending[cat.id]) {
      categorySpending[cat.id] = { name: cat.name, color: cat.color, emoji: cat.emoji, amount: 0 }
    }
    categorySpending[cat.id].amount += moneyToNumber(inst.amount)
  }

  // 4b. Fetch previous month spending for rollover-enabled categories
  const rolloverBudgets = categoryBudgets.filter(cb => cb.rolloverEnabled)
  const prevMonthSpending: Record<string, number> = {}

  if (rolloverBudgets.length > 0) {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
    const prevEndDate = endOfMonth(prevStartDate)

    const prevInstallments = await prisma.installment.findMany({
      where: {
        dueDate: { gte: prevStartDate, lte: prevEndDate },
        transaction: {
          userId,
          categoryId: { in: rolloverBudgets.map(cb => cb.categoryId) },
        },
      },
      include: { transaction: { select: { categoryId: true } } },
    })

    for (const inst of prevInstallments) {
      const catId = inst.transaction.categoryId
      if (!prevMonthSpending[catId]) prevMonthSpending[catId] = 0
      prevMonthSpending[catId] += moneyToNumber(inst.amount)
    }
  }

  // 5. Build category budget status array
  // Include all categories that have spending OR a budget limit
  const allCategoryIds = new Set([
    ...Object.keys(categorySpending),
    ...categoryBudgets.map(cb => cb.categoryId),
  ])

  const categories = Array.from(allCategoryIds).map(categoryId => {
    const spending = categorySpending[categoryId]
    const budget = categoryBudgets.find(cb => cb.categoryId === categoryId)
    const baseBudgetLimit = budget ? moneyToNumber(budget.amount) : null

    // Compute effective limit with rollover
    let effectiveLimit = baseBudgetLimit
    let rolloverAmount = 0
    if (budget?.rolloverEnabled && baseBudgetLimit !== null && baseBudgetLimit > 0) {
      const prevSpend = prevMonthSpending[categoryId] || 0
      rolloverAmount = Math.round((baseBudgetLimit - prevSpend) * 100) / 100
      // Rollover can be positive (underspent) or negative (overspent)
      effectiveLimit = Math.round((baseBudgetLimit + rolloverAmount) * 100) / 100
    }

    const actualSpending = spending ? Math.round(spending.amount * 100) / 100 : 0
    const percentage = effectiveLimit && effectiveLimit > 0
      ? Math.round((actualSpending / effectiveLimit) * 100)
      : 0

    let status: 'under' | 'warning' | 'exceeded' | 'no-limit' = 'no-limit'
    if (effectiveLimit !== null && effectiveLimit > 0) {
      if (percentage > 100) status = 'exceeded'
      else if (percentage >= 80) status = 'warning'
      else status = 'under'
    }

    return {
      categoryId,
      categoryName: spending?.name || budget?.category.name || 'Unknown',
      categoryColor: spending?.color || budget?.category.color || null,
      categoryEmoji: spending?.emoji || budget?.category.emoji || null,
      budgetLimit: effectiveLimit,
      baseBudgetLimit,
      rolloverAmount: budget?.rolloverEnabled ? rolloverAmount : 0,
      rolloverEnabled: budget?.rolloverEnabled || false,
      actualSpending,
      percentage,
      status,
    }
  })

  // Fire-and-forget: budget warning notifications
  for (const cat of categories) {
    if (cat.status === 'exceeded') {
      createNotification(userId, 'budget_warning',
        `${cat.categoryName} estourou o orçamento!`,
        `Você gastou ${cat.percentage}% do limite de ${cat.categoryName}. Bora rever os gastos?`,
        '/orcamento'
      ).catch(() => {})
    } else if (cat.status === 'warning') {
      createNotification(userId, 'budget_warning',
        `Opa, ${cat.categoryName} já tá em ${cat.percentage}%!`,
        `${cat.categoryName} tá chegando no limite. Fica de olho!`,
        '/orcamento'
      ).catch(() => {})
    }
  }

  // 6. Compute totals
  const totalIncome = incomes.reduce(
    (sum, inc) => sum + moneyToNumber(inc.amount),
    0
  )
  const totalSpending = Object.values(categorySpending).reduce(
    (sum, cat) => sum + cat.amount,
    0
  )
  const remaining = Math.round((totalIncome - totalSpending) * 100) / 100
  const savingsRate = totalIncome > 0
    ? Math.round((remaining / totalIncome) * 100)
    : 0

  return {
    month,
    year,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalSpending: Math.round(totalSpending * 100) / 100,
    remaining,
    savingsRate,
    incomes: incomes.map(inc => ({
      id: inc.id,
      description: inc.description,
      amount: moneyToNumber(inc.amount),
      isRecurring: inc.isRecurring,
      month: inc.month,
      year: inc.year,
      createdAt: inc.createdAt.toISOString(),
    })),
    categories: categories.sort((a, b) => b.actualSpending - a.actualSpending),
  }
})
