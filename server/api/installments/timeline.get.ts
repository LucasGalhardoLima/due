import { z } from 'zod'
import { startOfMonth, endOfMonth, addMonths, format, getYear, getMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import prisma from '../../utils/prisma'
import { getUser } from '../../utils/session'
import { moneyToCents, moneyToNumber } from '../../utils/money'

const querySchema = z.object({
  months: z.coerce.number().min(1).max(24).default(12),
  cardId: z.string().optional()
})

export type TimelineMonthStatus = 'safe' | 'warning' | 'danger'

export interface TimelineTransaction {
  description: string
  amount: number
  installmentNumber: number
  totalInstallments: number
  category: string
}

export interface TimelineMonth {
  year: number
  month: number // 0-11
  label: string // "Mar 2024"
  totalCommitted: number
  installmentCount: number
  limitUsagePercent: number
  status: TimelineMonthStatus
  alert?: string
  transactions: TimelineTransaction[]
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (body) => querySchema.parse(body))
  const { months, cardId } = query
  
  const { userId } = getUser(event) 

  const now = new Date()
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(addMonths(now, months - 1))

  // Fetch all installments in range
  const installments = await prisma.installment.findMany({
    where: {
      transaction: {
        userId,
        ...(cardId ? { cardId } : {})
      },
      dueDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      transaction: {
        select: {
          description: true,
          installmentsCount: true,
          category: {
            select: { name: true }
          },
          card: {
            select: { limit: true, budget: true }
          }
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  })

  // Get total limit (fetching from first installment's card or separate query if needed)
  // For simplicity, if cardId is provided, we fetch that card. If not, we might sum all cards?
  // The user request says "totalLimit". If no card selected, it means "global limit".
  
  let totalLimit = 0
  let totalBudget = 0

  if (cardId) {
    const card = await prisma.creditCard.findUnique({ where: { id: cardId } })
    if (card) {
      totalLimit = moneyToNumber(card.limit)
      totalBudget = card.budget ? moneyToNumber(card.budget) : 0
    }
  } else {
    // If multiple cards, sum their limits
    const cards = await prisma.creditCard.findMany({ where: { userId } })
    totalLimit = cards.reduce((sum: number, c) => sum + moneyToNumber(c.limit), 0)
    totalBudget = cards.reduce((sum: number, c) => sum + (c.budget ? moneyToNumber(c.budget) : 0), 0)
  }

  // Group by YYYY-MM
  const monthsMap = new Map<string, TimelineMonth>()

  // Initialize all months in range with empty data
  for (let i = 0; i < months; i++) {
    const d = addMonths(startDate, i)
    const y = getYear(d)
    const m = getMonth(d)
    const key = `${y}-${m}`
    
    // Capitalize first letter of month name
    const monthName = format(d, 'MMM', { locale: ptBR })
    const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${format(d, 'yy')}`

    monthsMap.set(key, {
      year: y,
      month: m,
      label,
      totalCommitted: 0,
      installmentCount: 0,
      limitUsagePercent: 0,
      status: 'safe',
      transactions: []
    })
  }

  // Populate data
  const distinctTransactionIds = new Set<string>()

  for (const inst of installments) {
    const y = getYear(inst.dueDate)
    const m = getMonth(inst.dueDate)
    const key = `${y}-${m}`
    
    // Look ahead only within our timeline
    if (monthsMap.has(key)) {
      const entry = monthsMap.get(key)!
      entry.totalCommitted += moneyToCents(inst.amount) / 100
      entry.installmentCount++
      
      // Top transactions list - keep all for now, maybe filter top 5 in frontend or here?
      // User request says "top installments". Let's push all and sort later or let frontend handle viewing details.
      // But to save payload size, maybe limiting is better. 
      // "transactions[]: top installments"
      // Let's keep it simple: add all, frontend can slice. Or maybe just top 10 by amount.
      
      entry.transactions.push({
        description: inst.transaction.description,
        amount: inst.amount,
        installmentNumber: inst.number,
        totalInstallments: inst.transaction.installmentsCount,
        category: inst.transaction.category?.name || 'Geral'
      })

      if (inst.dueDate > now) {
        distinctTransactionIds.add(inst.transactionId)
      }
    }
  }

  // Calculate metrics and statuses
  const timeline: TimelineMonth[] = []
  
  for (const [_, monthData] of monthsMap) {
    // Sort transactions by amount desc
    monthData.transactions.sort((a, b) => b.amount - a.amount)
    
    // Usage %
    if (totalLimit > 0) {
      monthData.limitUsagePercent = (monthData.totalCommitted / totalLimit) * 100
    }

    // Status
    if (monthData.limitUsagePercent > 80) {
      monthData.status = 'danger'
      monthData.alert = `Comprometimento alto! ${monthData.limitUsagePercent.toFixed(1)}% do limite.`
    } else if (monthData.limitUsagePercent > 50) {
      monthData.status = 'warning'
    } else {
      monthData.status = 'safe'
    }

    timeline.push(monthData)
  }

  return {
    months: timeline,
    totalLimit,
    totalBudget: totalBudget || null,
    activeInstallmentPlans: distinctTransactionIds.size
  }
})
