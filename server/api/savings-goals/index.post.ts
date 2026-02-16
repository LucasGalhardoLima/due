import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  deadline: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  // Tier: count limit
  const goalCount = await prisma.savingsGoal.count({ where: { userId } })
  enforceTierAccess(checkCountLimit(appUser.tier, 'maxSavingsGoals', goalCount))

  const goal = await prisma.savingsGoal.create({
    data: {
      name: result.data.name,
      targetAmount: result.data.targetAmount,
      deadline: result.data.deadline ? new Date(result.data.deadline) : null,
      userId,
    },
  })

  setResponseStatus(event, 201)
  return serializeDecimals(goal)
})
