import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns'

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
  const categoryTotals = new Map<string, { name: string; total: number }>()
  let grandTotal = 0
  
  for (const inst of installments) {
    const catId = inst.transaction.categoryId
    const catName = inst.transaction.category.name
    
    const existing = categoryTotals.get(catId) || { name: catName, total: 0 }
    existing.total += inst.amount
    categoryTotals.set(catId, existing)
    grandTotal += inst.amount
  }
  
  // Convert to array and sort descending
  const categories = Array.from(categoryTotals.values())
    .map(cat => {
      const relatedInst = installments.find(i => i.transaction.category.name === cat.name)
      return {
        name: cat.name,
        total: Math.round(cat.total * 100) / 100,
        percentage: grandTotal > 0 ? Math.round((cat.total / grandTotal) * 10000) / 100 : 0,
        color: (relatedInst?.transaction.category as any)?.color || '#333'
      }
    })
    .sort((a, b) => b.total - a.total)
  
  return {
    categories,
    grandTotal: Math.round(grandTotal * 100) / 100,
    month: getMonth(now) + 1,
    year: getYear(now),
  }
})
