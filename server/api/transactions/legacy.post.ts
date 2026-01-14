import { z } from 'zod'
import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'

const createLegacySchema = z.object({
  description: z.string().min(1),
  amountPerInstallment: z.number().positive(),
  remainingInstallments: z.number().int().min(1),
  cardId: z.string().uuid(),
  categoryId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createLegacySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors
    })
  }

  const { description, amountPerInstallment, remainingInstallments, cardId, categoryId } = result.data
  
  // Total logic: strictly for the record, what is remaining.
  // We treat this as a "New Transaction" of the remaining debt.
  const totalAmount = amountPerInstallment * remainingInstallments
  const purchaseDate = new Date() // We assume "Impact starts now"

  // Fetch card
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  })

  if (!card) {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  // Generate Plan
  const plan = FinanceUtils.generateInstallments(
    totalAmount,
    remainingInstallments,
    purchaseDate,
    card.closingDay,
    card.dueDay
  )

  // Resolve Category
  let finalCategoryId = categoryId
  if (!finalCategoryId) {
    const defaultCat = await prisma.category.findFirst({ where: { name: 'Outros' } })
    if (defaultCat) {
      finalCategoryId = defaultCat.id
    } else {
      const newCat = await prisma.category.create({
        data: { name: 'Outros' }
      })
      finalCategoryId = newCat.id
    }
  }

  // Create Transaction
  const transaction = await prisma.transaction.create({
    data: {
      description: `${description} (Legado)`,
      amount: totalAmount,
      purchaseDate: purchaseDate,
      installmentsCount: remainingInstallments,
      cardId,
      categoryId: finalCategoryId!,
      installments: {
        create: plan.map(p => ({
            number: p.number,
            amount: p.amount,
            dueDate: p.dueDate
        }))
      }
    },
    include: {
        installments: true
    }
  })

  return transaction
})
