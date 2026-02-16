import { z } from 'zod'
import prisma from '../../utils/prisma'
import { moneyFromCents, moneyToCents, serializeDecimals } from '../../utils/money'

const createCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.number().min(0, 'Limite deve ser positivo'),
  budget: z.number().min(0).optional(),
  closingDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  const body = await readBody(event)
  const result = createCardSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { name, limit, budget, closingDay, dueDay } = result.data

  // Check if this is the first card for THIS user - if so, make it default
  const existingCardsCount = await prisma.creditCard.count({
    where: { userId }
  })
  enforceTierAccess(checkCountLimit(appUser.tier, 'maxCards', existingCardsCount))
  const isDefault = existingCardsCount === 0

  const card = await prisma.creditCard.create({
    data: {
      name,
      limit: moneyFromCents(moneyToCents(limit)),
      budget: budget === undefined ? undefined : moneyFromCents(moneyToCents(budget)),
      closingDay,
      dueDay,
      isDefault,
      userId,
    }
  })

  return serializeDecimals(card)
})
