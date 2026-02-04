import { z } from 'zod'
import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'
import { moneyFromCents, moneyToCents, serializeDecimals } from '../../utils/money'

const createLegacySchema = z.object({
  description: z.string().min(1),
  amountPerInstallment: z.number().positive(),
  remainingInstallments: z.number().int().min(1),
  cardId: z.string().uuid(),
  categoryId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  /* 
     NOTE: We are using getUser(event) which is auto-imported.
     If linter complains, it's safe to ignore as long as build passes.
  */
  const { userId } = getUser(event) // 1. Get User

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
  const card = await prisma.creditCard.findFirst({
    where: { 
      id: cardId,
      userId // 2. Verify Ownership
    }
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
    // 3. Scope Category to User
    const defaultCat = await prisma.category.findFirst({ 
      where: { 
        name: 'Outros',
        userId
      } 
    })
    
    if (defaultCat) {
      finalCategoryId = defaultCat.id
    } else {
      const newCat = await prisma.category.create({
        data: { 
          name: 'Outros',
          userId 
        }
      })
      finalCategoryId = newCat.id
    }
  } else {
    // Verify category ownership if provided
     const cat = await prisma.category.findFirst({
        where: { id: finalCategoryId, userId }
     })
     if (!cat) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid Category' })
     }
  }

  // Create Transaction
  const transaction = await prisma.transaction.create({
    data: {
      description: `${description} (Legado)`,
      amount: moneyFromCents(moneyToCents(totalAmount)),
      purchaseDate: purchaseDate,
      installmentsCount: remainingInstallments,
      cardId,
      categoryId: finalCategoryId!,
      userId, // 4. Assign Owner
      installments: {
        create: plan.map(p => ({
            number: p.number,
            amount: moneyFromCents(moneyToCents(p.amount)),
            dueDate: p.dueDate
        }))
      }
    },
    include: {
        installments: true
    }
  })

  return serializeDecimals(transaction)
})
