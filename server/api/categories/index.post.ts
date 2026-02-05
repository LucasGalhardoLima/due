import { z } from 'zod'
import prisma from '../../utils/prisma'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const body = await readBody(event)
  const result = createCategorySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  const { name } = result.data

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
    '#00F2DE', // Pearl Aqua (Primary)
    '#10b981', // Emerald 500
    '#06b6d4', // Cyan 500
    '#0d9488', // Teal 600
    '#0ea5e9', // Sky 500
    '#6366f1', // Indigo 500
    '#f59e0b', // Amber 500
    '#f43f5e', // Rose 500
  ]
  const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]

  const category = await prisma.category.create({
    data: { 
      name,
      color: randomColor,
      userId
    }
  })

  return category
})
