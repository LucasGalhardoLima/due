import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

const bodySchema = z.object({
  description: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  isRecurring: z.boolean().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).optional(),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const existing = await prisma.income.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const income = await prisma.income.update({
    where: { id },
    data: result.data,
  })

  return serializeDecimals(income)
})
