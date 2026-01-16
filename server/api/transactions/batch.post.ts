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
  const { userId } = getUser(event)
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
  
  // Fetch Default Category (Outros) for User
  let defaultCategoryId = ''
  const defaultCat = await prisma.category.findFirst({ 
    where: { 
      name: 'Outros',
      userId
    } 
  })
  if (defaultCat) {
      defaultCategoryId = defaultCat.id
  } else {
      const newCat = await prisma.category.create({ 
        data: { 
          name: 'Outros',
          userId
        } 
      })
      defaultCategoryId = newCat.id
  }

  let count = 0
  for (const t of transactions) {
      // ... card fetching ...
      let card = cardCache.get(t.cardId)
      if (!card) {
          card = await prisma.creditCard.findUnique({ where: { id: t.cardId } })
          // Verify Ownership
          if (card && card.userId === userId) {
            cardCache.set(t.cardId, card)
          } else {
            // If card not found or not owned, skip or error? 
            // For batch, maybe skip or fail. Let's skip for safety or fail.
            // Let's assume frontend sent valid cards, but if not owned, we can't use it.
            continue
          }
      }

      // If we still don't have a card (because it didn't exist or wasn't owned), skip this tx
      if (!card) continue

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
              userId, // Inject User ID
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
