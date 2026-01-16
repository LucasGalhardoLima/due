import { z } from 'zod'
import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'

const updateSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  purchaseDate: z.string().datetime(), // ISO string from frontend
  installmentsCount: z.number().int().min(1).default(1),
  cardId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  isSubscription: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event) // 1. Get User
  const id = event.context.params?.id
  const body = await readBody(event)
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const result = updateSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors
    })
  }

  const { description, amount, purchaseDate, installmentsCount, cardId, categoryId, isSubscription } = result.data
  const pDate = new Date(purchaseDate)

  // 1. Fetch Existing AND Verify Ownership
  const existing = await prisma.transaction.findFirst({
    where: { 
      id,
      userId
    },
    include: { installments: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
  }

  // 2. Determine if we need to regenerate installments
  // We regenerate if: Amount changed OR Date changed OR Card changed OR Installments Count changed
  // We do looser comparison for Date to avoid small time diffs (though frontend usually sends YYYY-MM-DDT12:00:00Z)
  const isAmountChanged = Math.abs(existing.amount - amount) > 0.01
  const isCountChanged = existing.installmentsCount !== installmentsCount
  const isCardChanged = existing.cardId !== cardId
  const isDateChanged = existing.purchaseDate.toISOString().split('T')[0] !== pDate.toISOString().split('T')[0]

  const shouldRegenerate = isAmountChanged || isCountChanged || isCardChanged || isDateChanged

  // 3. Prepare Updates
  let finalCategoryId = categoryId
  if (!finalCategoryId) {
       // Keep existing or fetch 'Outros' (Logic same as create)
       finalCategoryId = existing.categoryId
  }

  if (shouldRegenerate) {
     // Fetch card for closing day
     const card = await prisma.creditCard.findUnique({ where: { id: cardId } })
     if (!card) throw createError({ statusCode: 404, statusMessage: 'New Card not found' })

     const plan = FinanceUtils.generateInstallments(
        amount,
        installmentsCount,
        pDate,
        card.closingDay,
        card.dueDay
     )

     // Transaction Update with overwrite (Delete installments, create new)
     return await prisma.$transaction(async (tx) => {
        // Delete old installments
        await tx.installment.deleteMany({
            where: { transactionId: id }
        })

        // Update Transaction
        const updated = await tx.transaction.update({
            where: { id },
            data: {
                description,
                amount,
                purchaseDate: pDate,
                installmentsCount,
                cardId,
                categoryId: finalCategoryId!,
                isSubscription,
                installments: {
                    create: plan.map(p => ({
                        number: p.number,
                        amount: p.amount,
                        dueDate: p.dueDate
                    }))
                }
            },
            include: { installments: true }
        })
        return updated
     })

  } else {
      // Simple Metadata Update
      const updated = await prisma.transaction.update({
          where: { id },
          data: {
              description,
              categoryId: finalCategoryId!,
              isSubscription
              // We don't update amount/date/card if they didn't change enough to trigger regen
          }
      })
      return updated
  }
})
