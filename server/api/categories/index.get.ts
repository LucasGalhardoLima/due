import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  return await prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' }
  })
})
