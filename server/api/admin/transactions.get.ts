import { z } from 'zod'
import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50'),
  search: z.string().optional(),
  cardId: z.string().optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const { page, limit, search, cardId, categoryId, startDate, endDate } = querySchema.parse(query)

  const pageNumber = parseInt(page)
  const pageSize = parseInt(limit)
  const skip = (pageNumber - 1) * pageSize

  // Build dynamic where clause
  const where: any = { userId }

  if (search) {
    where.description = { contains: search, mode: 'insensitive' }
  }

  if (cardId) {
    where.cardId = cardId
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (startDate || endDate) {
    where.purchaseDate = {}
    if (startDate) {
      where.purchaseDate.gte = new Date(startDate)
    }
    if (endDate) {
      where.purchaseDate.lte = new Date(endDate + 'T23:59:59.999Z')
    }
  }

  // Fetch total count for pagination metadata
  const total = await prisma.transaction.count({ where })

  // Fetch slice of transactions
  const transactions = await prisma.transaction.findMany({
    skip,
    take: pageSize,
    where,
    orderBy: {
      purchaseDate: 'desc'
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
