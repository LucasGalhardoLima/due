import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (!user) {
    return { unread: 0 }
  }

  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  })

  return { unread }
})
