import { z } from 'zod'
import prisma from '../../utils/prisma'
import { moneyToNumber, serializeDecimals } from '../../utils/money'
import { createNotification } from '../../utils/notifications'

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().nullable().optional(),
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

  const updateData: Record<string, unknown> = {}
  if (result.data.name !== undefined) updateData.name = result.data.name
  if (result.data.targetAmount !== undefined) updateData.targetAmount = result.data.targetAmount
  if (result.data.currentAmount !== undefined) updateData.currentAmount = result.data.currentAmount
  if (result.data.deadline !== undefined) {
    updateData.deadline = result.data.deadline ? new Date(result.data.deadline) : null
  }

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: updateData,
  })

  // Fire-and-forget: milestone notifications when currentAmount changes
  if (result.data.currentAmount !== undefined) {
    const targetAmount = moneyToNumber(existing.targetAmount)
    if (targetAmount > 0) {
      const prevProgress = (moneyToNumber(existing.currentAmount) / targetAmount) * 100
      const newProgress = (result.data.currentAmount / targetAmount) * 100

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
  }

  return serializeDecimals(goal)
})
