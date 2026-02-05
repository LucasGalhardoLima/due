import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns'
import { sumMoneyToCents } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const now = new Date()
  const currentMonth = getMonth(now)
  const currentYear = getYear(now)
  
  // Get all installments due in the current month
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(now)
  
  const installments = await prisma.installment.findMany({
    where: {
      transaction: {
        userId
      },
      dueDate: {
        gte: startDate,
        lte: endDate,
      }
    }
  })
  
  const totalCents = sumMoneyToCents(installments.map(inst => inst.amount))
  
  return {
    total: totalCents / 100,
    month: currentMonth + 1, // 1-indexed for display
    year: currentYear,
    installmentsCount: installments.length,
  }
})
