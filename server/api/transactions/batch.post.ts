import { z } from 'zod'
import { Prisma } from '@prisma/client'

const batchCreateSchema = z.array(z.object({
  description: z.string(),
  amount: z.number(),
  date: z.string(), // ISO String
  categoryId: z.string().optional(),
  cardId: z.string(),
}))

import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'

// ...

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = batchCreateSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const transactions = result.data
  
  // Cache for cards
  const cardCache = new Map<string, any>()
  
  // Fetch Default Category (Outros)
  let defaultCategoryId = ''
  const defaultCat = await prisma.category.findFirst({ where: { name: 'Outros' } })
  if (defaultCat) {
      defaultCategoryId = defaultCat.id
  } else {
      const newCat = await prisma.category.create({ data: { name: 'Outros' } })
      defaultCategoryId = newCat.id
  }

  let count = 0
  for (const t of transactions) {
      // ... card fetching ...
      let card = cardCache.get(t.cardId)
      if (!card) {
          card = await prisma.creditCard.findUnique({ where: { id: t.cardId } })
          if (card) cardCache.set(t.cardId, card)
      }

      const purchaseDate = new Date(t.date)
      let dueDate = purchaseDate

      if (card) {
          const plan = FinanceUtils.generateInstallments(
              t.amount,
              1,
              purchaseDate,
              card.closingDay,
              card.dueDay
          )
          if (plan.length > 0 && plan[0]) {
              dueDate = plan[0].dueDate
          }
      }

      await prisma.transaction.create({
          data: {
              description: t.description,
              amount: t.amount,
              purchaseDate: purchaseDate,
              installmentsCount: 1,
              cardId: t.cardId,
              categoryId: t.categoryId || defaultCategoryId, // Fallback
              isSubscription: false,
              installments: {
                  create: {
                      number: 1,
                      amount: t.amount,
                      dueDate: dueDate
                  }
              }
          }
      })
      count++
  }

  return { count }
})
