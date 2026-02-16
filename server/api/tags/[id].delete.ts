import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing ID',
    })
  }

  const tag = await prisma.tag.findFirst({
    where: { id, userId },
  })

  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Tag not found',
    })
  }

  // Cascade delete will remove TransactionTag entries automatically
  await prisma.tag.delete({
    where: { id },
  })

  return { success: true }
})
