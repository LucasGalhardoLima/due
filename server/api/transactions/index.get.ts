import { z } from 'zod'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'
import { endOfMonth } from 'date-fns'

const querySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  cardId: z.string().uuid().optional(),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query params' })
  }

  const now = new Date()
  const month = result.data.month ? parseInt(result.data.month) : now.getMonth() + 1
  const year = result.data.year ? parseInt(result.data.year) : now.getFullYear()

  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)

  const where: Record<string, unknown> = {
    dueDate: { gte: startDate, lte: endDate },
    transaction: { userId } as Record<string, unknown>,
  }

  if (result.data.categoryId) {
    ;(where.transaction as Record<string, unknown>).categoryId = result.data.categoryId
  }

  if (result.data.cardId) {
    ;(where.transaction as Record<string, unknown>).cardId = result.data.cardId
  }

  const installments = await prisma.installment.findMany({
    where,
    include: {
      transaction: {
        include: {
          category: true,
          card: true,
        },
      },
    },
    orderBy: {
      transaction: {
        purchaseDate: 'desc',
      },
    },
  })

  const transactions = installments.map((inst) => ({
    id: inst.id,
    transactionId: inst.transaction.id,
    description: inst.transaction.description,
    amount: moneyToNumber(inst.amount),
    category: inst.transaction.category.name,
    categoryEmoji: inst.transaction.category.emoji,
    categoryIcon: inst.transaction.category.emoji || 'creditcard',
    installmentNumber: inst.number,
    totalInstallments: inst.transaction.installmentsCount,
    cardName: inst.transaction.card?.name || 'N/A',
    cardId: inst.transaction.cardId,
    categoryId: inst.transaction.categoryId,
    purchaseDate: inst.transaction.purchaseDate,
    isSubscription: inst.transaction.isSubscription,
  }))

  return {
    month,
    year,
    transactions,
    total: transactions.length,
  }
})
