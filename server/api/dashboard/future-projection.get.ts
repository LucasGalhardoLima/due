import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, addMonths, getMonth, getYear } from 'date-fns'

export default defineEventHandler(async () => {
  const now = new Date()
  const projections = []
  
  // Calculate for next 3 months
  for (let i = 1; i <= 3; i++) {
    const targetDate = addMonths(now, i)
    const startDate = startOfMonth(targetDate)
    const endDate = endOfMonth(targetDate)
    
    const installments = await prisma.installment.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        }
      }
    })
    
    const total = installments.reduce((sum, inst) => sum + inst.amount, 0)
    
    projections.push({
      month: getMonth(targetDate) + 1, // 1-indexed
      year: getYear(targetDate),
      total: Math.round(total * 100) / 100,
      installmentsCount: installments.length,
    })
  }
  
  return { projections }
})
