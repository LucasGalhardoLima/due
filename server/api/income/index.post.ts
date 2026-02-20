import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

const bodySchema = z.object({
  description: z.string().min(1).max(100),
  amount: z.number().positive(),
  isRecurring: z.boolean().default(true),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const income = await prisma.income.create({
    data: {
      ...result.data,
      userId,
    },
  })

  setResponseStatus(event, 201)
  return serializeDecimals(income)
})
