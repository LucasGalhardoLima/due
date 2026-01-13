import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, addMonths, getMonth, getYear } from 'date-fns'

export default defineEventHandler(async () => {
  const now = new Date()
  const currentMonth = getMonth(now)
  const currentYear = getYear(now)
  
  // Get all installments due in the current month
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(now)
  
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: startDate,
        lte: endDate,
      }
    }
  })
  
  const total = installments.reduce((sum, inst) => sum + inst.amount, 0)
  
  return {
    total: Math.round(total * 100) / 100,
    month: currentMonth + 1, // 1-indexed for display
    year: currentYear,
    installmentsCount: installments.length,
  }
})
