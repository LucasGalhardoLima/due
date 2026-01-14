import { z } from 'zod'
import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay } from 'date-fns'

const querySchema = z.object({
  month: z.string().optional(), // 1-12
  year: z.string().optional(),
  cardId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const query = await getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  }

  const today = new Date()
  const month = result.data.month ? parseInt(result.data.month) : today.getMonth() + 1
  const year = result.data.year ? parseInt(result.data.year) : today.getFullYear()

  // Define Date Range for "Invoiced Installments"
  // Note: We are looking for installments whose dueDate falls in this month/year.
  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)

  // Fetch Installments for this period
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: startDate,
        lte: endDate
      },
      transaction: {
        cardId: result.data.cardId // Optional filter
      }
    },
    include: {
      transaction: {
        include: {
          category: true,
          card: true
        }
      }
    },
    orderBy: {
      transaction: {
        purchaseDate: 'desc'
      }
    }
  })

  // Calculate Totals
  const totalInvoice = installments.reduce((acc, curr) => acc + curr.amount, 0)

  // Calculate Limits (If filtering by card, or aggregate logic?)
  // If no cardId, we sum limits of ALL cards? Or just show "N/A"?
  // Let's sum all cards limits for "Global View" logic.
  let totalLimit = 0
  if (result.data.cardId) {
    const card = await prisma.creditCard.findUnique({ where: { id: result.data.cardId } })
    totalLimit = card?.limit || 0
  } else {
    const cards = await prisma.creditCard.findMany()
    totalLimit = cards.reduce((acc, c) => acc + c.limit, 0)
  }

  // Group Transactions by Date
  // Note: We group by PURCHASE DATE or DUE DATE?
  // Visual requirement: "List of Launches". Usually users want to see WHEN they bought it.
  // But if it's an installment of a purchase made 5 months ago, showing "Jan 15" (purchase date) might be confusing if we are in June.
  // However, usually for the current invoice, we show the items.
  // Let's grouped by Purchase Date for context, but clarifying it's "Parcela X/Y".
  const groupedTransactions: Record<string, any[]> = {}
  
  installments.forEach(inst => {
    // We group by Purchase Date (Day)
    const pDate = new Date(inst.transaction.purchaseDate).toISOString().split('T')[0]
    if (!groupedTransactions[pDate]) {
        groupedTransactions[pDate] = []
    }
    groupedTransactions[pDate].push({
        id: inst.id,
        description: inst.transaction.description,
        amount: inst.amount,
        category: inst.transaction.category.name,
        categoryIcon: 'shopping-bag', // TODO: Map real icons
        installmentNumber: inst.number,
        totalInstallments: inst.transaction.installmentsCount,
        cardName: inst.transaction.card.name,
        purchaseDate: inst.transaction.purchaseDate
    })
  })

  return {
    month,
    year,
    total: totalInvoice,
    limit: totalLimit,
    available: totalLimit - totalInvoice,
    transactions: groupedTransactions
  }
})
