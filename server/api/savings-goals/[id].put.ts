import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

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

  return serializeDecimals(goal)
})
