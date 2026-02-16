import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

const bodySchema = z.object({
  amount: z.number().min(0),
  rolloverEnabled: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  const categoryId = getRouterParam(event, 'categoryId')
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  // Verify category ownership
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  })

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  // Tier: count limit for new budgets
  const existingBudget = await prisma.categoryBudget.findUnique({ where: { categoryId: categoryId! } })
  if (!existingBudget) {
    const budgetCount = await prisma.categoryBudget.count({ where: { userId } })
    enforceTierAccess(checkCountLimit(appUser.tier, 'maxCategoryBudgets', budgetCount))
  }

  // Tier: rollover gate
  if (result.data.rolloverEnabled) {
    enforceTierAccess(checkFeatureAccess(appUser.tier, 'budgetRollover'))
  }

  // Upsert: create or update
  const budget = await prisma.categoryBudget.upsert({
    where: { categoryId: categoryId! },
    create: {
      amount: result.data.amount,
      rolloverEnabled: result.data.rolloverEnabled ?? false,
      categoryId: categoryId!,
      userId,
    },
    update: {
      amount: result.data.amount,
      ...(result.data.rolloverEnabled !== undefined && { rolloverEnabled: result.data.rolloverEnabled }),
    },
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
    },
  })

  return serializeDecimals(budget)
})
