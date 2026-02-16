import { z } from 'zod'
import prisma from '../../../utils/prisma'
import { moneyToNumber, serializeDecimals } from '../../../utils/money'

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

  return serializeDecimals(goal)
})
