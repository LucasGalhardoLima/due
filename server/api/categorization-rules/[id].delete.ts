import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ID' })
  }

  // Verify ownership
  const rule = await prisma.categorizationRule.findFirst({
    where: { id, userId },
  })

  if (!rule) {
    throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
  }

  await prisma.categorizationRule.delete({ where: { id } })

  return { success: true }
})
