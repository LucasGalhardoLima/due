import { z } from 'zod'
import prisma from '../../utils/prisma'

const querySchema = z.object({
  q: z.string().optional(),
  limit: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = await getQuery(event)
  const parsed = querySchema.safeParse(query)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid query' })
  }

  const q = parsed.data.q?.trim()
  if (!q || q.length < 2) {
    return []
  }

  const limit = Math.min(Math.max(parseInt(parsed.data.limit || '8', 10), 1), 20)

  const results = await prisma.transaction.findMany({
    where: {
      userId,
      description: {
        contains: q,
        mode: 'insensitive'
      }
    },
    select: { description: true },
    distinct: ['description'],
    orderBy: { purchaseDate: 'desc' },
    take: limit
  })

  return results.map((r) => r.description)
})
