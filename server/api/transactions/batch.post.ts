import { z } from 'zod'
import type { CreditCard } from '@prisma/client'
import { addMonths } from 'date-fns'

import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'
import { moneyFromCents, moneyToCents } from '../../utils/money'
const batchCreateSchema = z.array(z.object({
  description: z.string(),
  amount: z.number(),
  date: z.string(), // ISO String
  categoryId: z.string().optional(),
  cardId: z.string(),
  installmentsCount: z.number().int().min(1).default(1),
  faturaDueDate: z.string().optional(), // ISO String — anchors installment #1 to actual fatura date
}))

// ...

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(await checkAndIncrementUsage(appUser.dbUserId, appUser.tier, 'csv_imports'))

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
  const cardCache = new Map<string, CreditCard>()

  const categoryIds = Array.from(new Set(transactions.map(t => t.categoryId).filter(Boolean))) as string[]
  const categories = categoryIds.length
    ? await prisma.category.findMany({ where: { id: { in: categoryIds }, userId }, select: { id: true } })
    : []
  const allowedCategoryIds = new Set(categories.map(c => c.id))
  if (categoryIds.some(id => !allowedCategoryIds.has(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Category' })
  }
  
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
      const installmentsCount = t.installmentsCount

      // For parcelamentos, amount from fatura is per-installment — compute total
      const totalAmount = installmentsCount > 1
        ? Math.round(t.amount * installmentsCount * 100) / 100
        : t.amount

      // When faturaDueDate is provided (PDF import), anchor installments to actual
      // fatura dates instead of calculating from purchase date + card settings.
      // This ensures DB installment months match the real Itaú billing cycle.
      let plan: { number: number; amount: number; dueDate: Date }[]
      if (t.faturaDueDate) {
        const firstDueDate = new Date(t.faturaDueDate)
        const totalCents = Math.round(totalAmount * 100)
        const installmentCents = Math.floor(totalCents / installmentsCount)
        const remainderCents = totalCents % installmentsCount
        plan = []
        for (let i = 0; i < installmentsCount; i++) {
          const thisAmountCents = i === installmentsCount - 1 ? installmentCents + remainderCents : installmentCents
          plan.push({
            number: i + 1,
            amount: thisAmountCents / 100,
            dueDate: addMonths(firstDueDate, i),
          })
        }
      } else {
        plan = FinanceUtils.generateInstallments(
            totalAmount,
            installmentsCount,
            purchaseDate,
            card.closingDay,
            card.dueDay
        )
      }

      await prisma.transaction.create({
          data: {
              description: t.description,
              amount: moneyFromCents(moneyToCents(totalAmount)),
              purchaseDate: purchaseDate,
              installmentsCount: installmentsCount,
              cardId: t.cardId,
              categoryId: t.categoryId || defaultCategoryId, // Fallback
              isSubscription: false,
              userId, // Inject User ID
              installments: {
                  createMany: {
                      data: plan.map(inst => ({
                          number: inst.number,
                          amount: moneyFromCents(moneyToCents(inst.amount)),
                          dueDate: inst.dueDate,
                      })),
                  },
              },
          }
      })
      count++
  }

  return { count }
})
