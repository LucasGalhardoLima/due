import { z } from 'zod'
import prisma from '../../utils/prisma'

const bodySchema = z.object({
  read: z.literal(true),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing notification id' })
  }

  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  })

  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  })

  return { ok: true }
})
