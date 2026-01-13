import { z } from 'zod'
import prisma from '../../utils/prisma'

const createCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.number().min(0, 'Limite deve ser positivo'),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createCardSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { name, limit, closingDay, dueDay } = result.data

  const card = await prisma.creditCard.create({
    data: {
      name,
      limit,
      closingDay,
      dueDay,
    }
  })

  return card
})
