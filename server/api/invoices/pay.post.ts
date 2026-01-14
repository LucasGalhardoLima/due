import { z } from 'zod'
import prisma from '../../utils/prisma'

const bodySchema = z.object({
  cardId: z.string().uuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const { cardId, month, year } = result.data

  // Mark invoice as PAID
  const invoice = await prisma.invoice.upsert({
    where: {
      cardId_month_year: {
        cardId,
        month,
        year
      }
    },
    update: {
      status: 'PAID'
    },
    create: {
      cardId,
      month,
      year,
      status: 'PAID'
    }
  })

  return invoice
})
