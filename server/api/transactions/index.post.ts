import { z } from 'zod'
import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'

const createTransactionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  purchaseDate: z.string().datetime(), // ISO string
  installmentsCount: z.number().int().min(1).default(1),
  cardId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  isSubscription: z.boolean().default(false)
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event) // 1. Get User
  const body = await readBody(event)
  const result = createTransactionSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors
    })
  }

  const { description, amount, purchaseDate, installmentsCount, cardId, categoryId, isSubscription } = result.data
  const pDate = new Date(purchaseDate)

  // Fetch card to get closing date AND verify ownership
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  })

  // Ensure card belongs to user
  if (!card || card.userId !== userId) {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  // Generate Installment Plan
  const plan = FinanceUtils.generateInstallments(
    amount,
    installmentsCount,
    pDate,
    card.closingDay,
    card.dueDay
  )

  // Determine Category (use provided or find/create 'Outros')
  let finalCategoryId = categoryId
  
  if (!finalCategoryId) {
    const defaultCat = await prisma.category.findFirst({ 
      where: { 
        name: 'Outros',
        userId // Scope to user
      } 
    })
    if (defaultCat) {
      finalCategoryId = defaultCat.id
    } else {
      // Create 'Outros' if it doesn't exist for this user
      const newCat = await prisma.category.create({
        data: { name: 'Outros', userId }
      })
      finalCategoryId = newCat.id
    }
  } else {
    // Verify that the provided category belongs to the user
    const cat = await prisma.category.findUnique({ where: { id: finalCategoryId } })
    if (!cat || cat.userId !== userId) {
         // Fallback or error? Let's error to be safe
         throw createError({ statusCode: 400, statusMessage: 'Invalid Category' })
    }
  }
  
  // Transaction Create
  const transaction = await prisma.transaction.create({
    data: {
      description,
      amount,
      purchaseDate: pDate,
      installmentsCount,
      cardId,
      categoryId: finalCategoryId!,
      isSubscription,
      userId, // Assign to user
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
