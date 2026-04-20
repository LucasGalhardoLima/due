import { z } from 'zod'
import prisma from '../../utils/prisma'
import { moneyFromCents, moneyToCents, serializeDecimals } from '../../utils/money'

const updateCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.number().min(0, 'Limite deve ser positivo'),
  budget: z.number().min(0).nullable().optional(),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  dueNextMonth: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const body = await readBody(event)
  const result = updateCardSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const existing = await prisma.creditCard.findFirst({ where: { id, userId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Card not found' })

  const { name, limit, budget, closingDay, dueDay, dueNextMonth } = result.data

  const card = await prisma.creditCard.update({
    where: { id },
    data: {
      name,
      limit: moneyFromCents(moneyToCents(limit)),
      budget: budget == null ? null : moneyFromCents(moneyToCents(budget)),
      closingDay,
      dueDay,
      dueNextMonth,
    },
  })

  return serializeDecimals(card)
})
