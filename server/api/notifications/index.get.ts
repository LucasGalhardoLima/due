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

  const query = getQuery(event)
  const unreadOnly = query.unreadOnly === 'true'
  const limit = Math.min(Number(query.limit) || 20, 50)
  const cursor = query.cursor as string | undefined

  const where: Record<string, unknown> = { userId: user.id }
  if (unreadOnly) where.read = false

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = notifications.length > limit
  const items = hasMore ? notifications.slice(0, limit) : notifications

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  }
})
