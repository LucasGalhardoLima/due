import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'tags'))

  return await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
})
