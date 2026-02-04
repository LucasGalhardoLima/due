import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50')
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const { page, limit } = querySchema.parse(query)
  
  const pageNumber = parseInt(page)
  const pageSize = parseInt(limit)
  const skip = (pageNumber - 1) * pageSize

  // Fetch total count for pagination metadata
  const total = await prisma.transaction.count({
    where: { userId }
  })

  // Fetch slice of transactions
  const transactions = await prisma.transaction.findMany({
    skip,
    take: pageSize,
    where: { userId },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      card: {
        select: {
          name: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    }
  })

  return serializeDecimals({
    transactions,
    total,
    page: pageNumber,
    pageSize
  })
})
