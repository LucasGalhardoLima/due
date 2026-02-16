import { z } from 'zod'
import prisma from '../../utils/prisma'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().optional(),
  emoji: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  const body = await readBody(event)
  const result = createCategorySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { name, color: bodyColor, emoji } = result.data

  // Tier: count limit check
  const categoryCount = await prisma.category.count({ where: { userId } })
  enforceTierAccess(checkCountLimit(appUser.tier, 'maxCategories', categoryCount))

  // Check if category already exists for this user (case-insensitive)
  const existing = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      },
      userId
    }
  })

  if (existing) {
    return existing
  }

  const colorPalette = [
    '#D6FFF6', // Mint Green (Primary)
    '#BFF5E8', // Mint Soft
    '#8FE6D2', // Mint Mid
    '#64CCB8', // Mint Deep
    '#9B8CEA', // Violet Light
    '#7561D8', // Violet Mid
    '#4E3EA8', // Violet Deep
    '#231651', // Russian Violet (Secondary)
  ]
  const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]

  const category = await prisma.category.create({
    data: {
      name,
      color: bodyColor || randomColor,
      emoji: emoji || null,
      userId
    }
  })

  return category
})
