import { z } from 'zod'
import prisma from '../../utils/prisma'

const bodySchema = z.object({
  transactionId: z.string().min(1),
  tagIds: z.array(z.string()),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { transactionId, tagIds } = result.data

  // Verify transaction ownership
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  })

  if (!transaction) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Transaction not found',
    })
  }

  // Delete all existing TransactionTag for this transaction, then create new ones
  await prisma.$transaction([
    prisma.transactionTag.deleteMany({
      where: { transactionId },
    }),
    ...tagIds.map((tagId) =>
      prisma.transactionTag.create({
        data: { transactionId, tagId },
      })
    ),
  ])

  // Return updated tags for the transaction
  const updatedTags = await prisma.transactionTag.findMany({
    where: { transactionId },
    include: { tag: true },
  })

  return updatedTags.map((tt) => tt.tag)
})
