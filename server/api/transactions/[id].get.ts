import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400 })

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      card: true,
      category: true
    }
  })

  if (!transaction) {
    throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
  }

  return transaction
})
