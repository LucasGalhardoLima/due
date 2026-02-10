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
      color: randomColor,
      userId
    }
  })

  return category
})
