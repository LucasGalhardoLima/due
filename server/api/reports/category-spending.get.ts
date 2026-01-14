import { z } from 'zod'
import prisma from '../../utils/prisma'
import { endOfMonth } from 'date-fns'

const querySchema = z.object({
  month: z.string(), // 1-12
  year: z.string(),
})

export default defineEventHandler(async (event) => {
  const query = await getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query params' })
  }

  const month = parseInt(result.data.month)
  const year = parseInt(result.data.year)

  // 1. Define Range for Current Month
  const startDate = new Date(year, month - 1, 1)
  const endDate = endOfMonth(startDate)

  // 1. Fetch Installments with Include (Standard Method for SQLite/MVP)
  // Instead of Prisma GroupBy which has limitations on relations

  const installments = await prisma.installment.findMany({
    where: {
        dueDate: { gte: startDate, lte: endDate }
    },
    include: {
        transaction: {
            include: { category: true }
        }
    }
  })

  // Aggregate
  const total = installments.reduce((acc, i) => acc + i.amount, 0)
  const map: Record<string, { amount: number, name: string }> = {}

  installments.forEach(i => {
    const catName = i.transaction.category.name
    if (!map[catName]) map[catName] = { amount: 0, name: catName }
    map[catName].amount += i.amount
  })

  // Sort Descending
  const sorted = Object.values(map).sort((a, b) => b.amount - a.amount)
  
  const topCategory = sorted[0]
  
  if (!topCategory) {
    return { hasData: false }
  }

  const percentage = (topCategory.amount / (total || 1)) * 100

  // 3. Optional: Compare with Previous Month
  // Quick fetch of prev month total for this same category?
  // Let's keep it simple for now: Just "X% of your bill".

  return {
    hasData: true,
    topCategory: {
        name: topCategory.name,
        amount: topCategory.amount,
        percentage: Math.round(percentage)
    },
    totalInvoice: total
  }
})
