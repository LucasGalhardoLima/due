import { z } from 'zod'
import prisma from '../../utils/prisma'

const bodySchema = z.union([
  z.object({ completed: z.literal(true) }),
  z.object({ step: z.number().int().min(0).max(5) }),
])

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const data = result.data

  if ('completed' in data) {
    await prisma.user.updateMany({
      where: { clerkId: userId },
      data: { onboardingCompletedAt: new Date(), onboardingStep: 5 },
    })
  } else {
    await prisma.user.updateMany({
      where: { clerkId: userId },
      data: { onboardingStep: data.step },
    })
  }

  return { ok: true }
})
