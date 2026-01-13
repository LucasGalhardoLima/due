import { z } from 'zod'
import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'

const createTransactionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  purchaseDate: z.string().datetime(), // ISO string
  installmentsCount: z.number().int().min(1).default(1),
  cardId: z.string().uuid(),
  categoryId: z.string().uuid().optional() // Make optional for legacy load maybe? Or default 'Outros'
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = createTransactionSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: result.error.errors
    })
  }

  const { description, amount, purchaseDate, installmentsCount, cardId, categoryId } = result.data
  const pDate = new Date(purchaseDate)

  // Fetch card to get closing date
  const card = await prisma.creditCard.findUnique({
    where: { id: cardId }
  })

  if (!card) {
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
    const defaultCat = await prisma.category.findFirst({ where: { name: 'Outros' } })
    if (defaultCat) {
      finalCategoryId = defaultCat.id
    } else {
      // Create 'Outros' if it doesn't exist
      const newCat = await prisma.category.create({
        data: { name: 'Outros' }
      })
      finalCategoryId = newCat.id
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
