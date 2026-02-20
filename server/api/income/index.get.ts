import { z } from 'zod'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

const querySchema = z.object({
  month: z.string(),
  year: z.string(),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const result = querySchema.safeParse(query)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query params' })
  }

  const month = parseInt(result.data.month)
  const year = parseInt(result.data.year)

  // Fetch incomes for this specific month + recurring incomes from prior months
  const incomes = await prisma.income.findMany({
    where: {
      userId,
      OR: [
        { month, year },
        { isRecurring: true, OR: [
          { year: { lt: year } },
          { year, month: { lte: month } },
        ]},
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalIncome = incomes.reduce(
    (sum, inc) => sum + moneyToNumber(inc.amount),
    0
  )

  return {
    incomes: incomes.map(inc => ({
      ...inc,
      amount: moneyToNumber(inc.amount),
      createdAt: inc.createdAt.toISOString(),
      updatedAt: inc.updatedAt.toISOString(),
    })),
    totalIncome: Math.round(totalIncome * 100) / 100,
  }
})
