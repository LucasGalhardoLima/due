import { z } from 'zod'
import prisma from '../../../utils/prisma'
import { moneyToNumber, serializeDecimals } from '../../../utils/money'
import { createNotification } from '../../../utils/notifications'

const bodySchema = z.object({
  amount: z.number().refine((val) => val !== 0, { message: 'Amount cannot be zero' }),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const existing = await prisma.savingsGoal.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const currentAmount = moneyToNumber(existing.currentAmount)
  const newAmount = currentAmount + result.data.amount

  if (newAmount < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Insufficient balance' })
  }

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: { currentAmount: newAmount },
  })

  // Fire-and-forget: milestone notifications
  const targetAmount = moneyToNumber(existing.targetAmount)
  if (targetAmount > 0) {
    const prevProgress = (currentAmount / targetAmount) * 100
    const newProgress = (newAmount / targetAmount) * 100

    for (const milestone of [25, 50, 75, 100]) {
      if (prevProgress < milestone && newProgress >= milestone) {
        const title = milestone === 100
          ? `Meta atingida: ${existing.name}!`
          : `${milestone}% da meta ${existing.name}!`
        const message = milestone === 100
          ? `Parabéns! Você bateu a meta "${existing.name}"! Mandou bem!`
          : `Você chegou a ${milestone}% da meta "${existing.name}". Bora continuar!`
        createNotification(userId, 'goal_milestone', title, message, '/metas').catch(() => {})
      }
    }
  }

  return serializeDecimals(goal)
})
