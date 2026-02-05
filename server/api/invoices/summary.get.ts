import { z } from 'zod'
import prisma from '../../utils/prisma'
import { endOfMonth } from 'date-fns'
import { moneyToNumber, sumMoneyToCents } from '../../utils/money'

const querySchema = z.object({
  month: z.string().optional(), // 1-12
  year: z.string().optional(),
  cardId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
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
        userId, // Filter by user
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
  const totalInvoiceCents = sumMoneyToCents(installments.map(inst => inst.amount))

  // Calculate Limits (If filtering by card, or aggregate logic?)
  // If no cardId, we sum limits of ALL cards? Or just show "N/A"?
  // Let's sum all cards limits for "Global View" logic.
  let totalLimit = 0
  let totalBudget = 0
  let card: { limit: unknown; budget: unknown | null; dueDay: number; closingDay: number } | null = null

  if (result.data.cardId) {
    const foundCard = await prisma.creditCard.findFirst({ 
      where: { 
        id: result.data.cardId,
        userId
      },
      select: { limit: true, budget: true, dueDay: true, closingDay: true }
    })
    card = foundCard
    totalLimit = foundCard?.limit ? moneyToNumber(foundCard.limit) : 0
    totalBudget = foundCard?.budget ? moneyToNumber(foundCard.budget) : 0
  } else {
    const cards = await prisma.creditCard.findMany({
      where: { userId }
    })
    totalLimit = cards.reduce((acc, c) => acc + moneyToNumber(c.limit), 0)
    // Sum budgets, treating null as 0
    totalBudget = cards.reduce((acc, c) => acc + (c.budget ? moneyToNumber(c.budget) : 0), 0)
  }

  // Group Transactions by Date
  // Note: We group by PURCHASE DATE or DUE DATE?
  // Visual requirement: "List of Launches". Usually users want to see WHEN they bought it.
  // But if it's an installment of a purchase made 5 months ago, showing "Jan 15" (purchase date) might be confusing if we are in June.
  // However, usually for the current invoice, we show the items.
  // Let's grouped by Purchase Date for context, but clarifying it's "Parcela X/Y".
  const groupedTransactions: Record<string, unknown[]> = {}
  
  installments.forEach(inst => {
    // We group by Purchase Date (Day)
    const pDate = new Date(inst.transaction.purchaseDate).toISOString().split('T')[0]
    if (pDate && !groupedTransactions[pDate]) {
        groupedTransactions[pDate] = []
    }
    if (pDate) {
      groupedTransactions[pDate]!.push({
        id: inst.id,
        transactionId: inst.transaction.id,
        description: inst.transaction.description,
        amount: moneyToNumber(inst.amount),
        category: inst.transaction.category.name,
        categoryIcon: 'shopping-bag', // TODO: Map real icons
        installmentNumber: inst.number,
        totalInstallments: inst.transaction.installmentsCount,
        cardName: inst.transaction.card?.name || 'N/A',
        purchaseDate: inst.transaction.purchaseDate
      })
    }
  })

  // Determine Invoice Status
  let status: 'OPEN' | 'PAID' | 'CLOSED' | null = null
  if (result.data.cardId) {
    const invoiceRecord = await prisma.invoice.findUnique({
      where: {
        cardId_month_year: {
          cardId: result.data.cardId,
          month,
          year
        }
      }
    })
    
    if (invoiceRecord) {
        status = invoiceRecord.status as 'OPEN' | 'PAID' | 'CLOSED'
    } else if (card) {
        const dueDate = new Date(year, month - 1, card.dueDay)
        status = new Date() > dueDate ? 'CLOSED' : 'OPEN'
    }
  }

  return {
    month,
    year,
    status, // Null when aggregating all cards
    total: totalInvoiceCents / 100,
    limit: totalLimit,
    budget: totalBudget,
    available: totalLimit - totalInvoiceCents / 100,
    transactions: groupedTransactions,
    dueDate: result.data.cardId && card ? new Date(year, month - 1, card.dueDay).toISOString() : null,
    closingDate: result.data.cardId && card ? new Date(year, month - 1, card.closingDay).toISOString() : null
  }
})
