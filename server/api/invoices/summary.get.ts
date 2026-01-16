import { z } from 'zod'
import prisma from '../../utils/prisma'
import { endOfMonth } from 'date-fns'

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
  const totalInvoice = installments.reduce((acc, curr) => acc + curr.amount, 0)

  // Calculate Limits (If filtering by card, or aggregate logic?)
  // If no cardId, we sum limits of ALL cards? Or just show "N/A"?
  // Let's sum all cards limits for "Global View" logic.
  let totalLimit = 0
  let totalBudget = 0

  if (result.data.cardId) {
    const card = await prisma.creditCard.findFirst({ 
      where: { 
        id: result.data.cardId,
        userId
      } 
    })
    totalLimit = card?.limit || 0
    totalBudget = card?.budget || 0
  } else {
    const cards = await prisma.creditCard.findMany({
      where: { userId }
    })
    totalLimit = cards.reduce((acc, c) => acc + c.limit, 0)
    // Sum budgets, treating null as 0
    totalBudget = cards.reduce((acc, c) => acc + (c.budget || 0), 0)
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
        amount: inst.amount,
        category: inst.transaction.category.name,
        categoryIcon: 'shopping-bag', // TODO: Map real icons
        installmentNumber: inst.number,
        totalInstallments: inst.transaction.installmentsCount,
        cardName: inst.transaction.card.name,
        purchaseDate: inst.transaction.purchaseDate
      })
    }
  })

  // Determine Invoice Status
  let status = 'OPEN'
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
        status = invoiceRecord.status
    } else {
        // Optional: Check if it's past due to mark as CLOSED/OVERDUE?
        // For MVP, if it doesn't exist, it's OPEN.
    }
  }

  return {
    month,
    year,
    status, // New field
    total: totalInvoice,
    limit: totalLimit,
    budget: totalBudget,
    available: totalLimit - totalInvoice,
    transactions: groupedTransactions
  }
})
