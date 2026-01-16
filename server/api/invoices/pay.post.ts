import { z } from 'zod'
import prisma from '../../utils/prisma'

const bodySchema = z.object({
  cardId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const { cardId, month, year } = result.data

  // Verify Card Ownership
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId }
  })

  if (!card) {
      throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  // Mark invoice as PAID
  // Note: Invoice model currently doesn't have userId directly, it relates to Card. 
  // Since we verified Card ownership, we are safe.
  // Ideally, Invoice should also have userId for index performance, but it's okay for now.
  const invoice = await prisma.invoice.upsert({
    where: {
      cardId_month_year: {
        cardId,
        month,
        year
      }
    },
    update: {
      status: 'PAID',
      userId // If we added userId to Invoice model, add it here.
    },
    create: {
      cardId,
      month,
      year,
      status: 'PAID',
      userId // If we added userId to Invoice model, add it here.
    }
  })

  return invoice
})
