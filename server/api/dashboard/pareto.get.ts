import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns'
import { moneyToCents } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const now = new Date()
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(now)
  
  // Get all installments for current month with their transaction's category
  const installments = await prisma.installment.findMany({
    where: {
      transaction: {
        userId
      },
      dueDate: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: {
      transaction: {
        include: {
          category: true
        }
      }
    }
  })
  
  // Group by category
  const categoryTotals = new Map<string, { name: string; totalCents: number; color: string }>()
  let grandTotalCents = 0
  
  for (const inst of installments) {
    const catId = inst.transaction.categoryId
    const catName = inst.transaction.category.name
    const catColor = inst.transaction.category.color || '#333'

    const existing = categoryTotals.get(catId) || { name: catName, totalCents: 0, color: catColor }
    existing.totalCents += moneyToCents(inst.amount)
    categoryTotals.set(catId, existing)
    grandTotalCents += moneyToCents(inst.amount)
  }
  
  // Convert to array and sort descending
  const categories = Array.from(categoryTotals.values())
    .map(cat => {
      return {
        name: cat.name,
        total: Math.round((cat.totalCents / 100) * 100) / 100,
        percentage: grandTotalCents > 0 ? Math.round(((cat.totalCents / grandTotalCents) * 100) * 100) / 100 : 0,
        color: cat.color
      }
    })
    .sort((a, b) => b.total - a.total)
  
  return {
    categories,
    grandTotal: Math.round((grandTotalCents / 100) * 100) / 100,
    month: getMonth(now) + 1,
    year: getYear(now),
  }
})
