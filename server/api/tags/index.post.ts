import { z } from 'zod'
import prisma from '../../utils/prisma'

const createTagSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio'),
  color: z.string().optional(),
  emoji: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'tags'))

  const body = await readBody(event)
  const result = createTagSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { name, color, emoji } = result.data

  // Check if tag already exists for this user (case-insensitive)
  const existing = await prisma.tag.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      userId,
    },
  })

  if (existing) {
    return existing
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      color: color || null,
      emoji: emoji || null,
      userId,
    },
  })

  setResponseStatus(event, 201)
  return tag
})
