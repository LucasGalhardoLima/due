import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const budgets = await prisma.categoryBudget.findMany({
    where: { userId },
    include: {
      category: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: { category: { name: 'asc' } },
  })

  return serializeDecimals(budgets)
})
