import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')

  const existing = await prisma.income.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  await prisma.income.delete({ where: { id } })

  return { success: true }
})
