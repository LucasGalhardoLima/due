import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400 })

  const transaction = await prisma.transaction.findFirst({
    where: { 
      id,
      userId
    },
    include: {
      card: true,
      category: true,
      tags: {
        include: { tag: true }
      }
    }
  })

  if (!transaction) {
    throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
  }

  return serializeDecimals(transaction)
})
