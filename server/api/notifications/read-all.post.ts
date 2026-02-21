import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true, readAt: new Date() },
  })

  return { ok: true }
})
