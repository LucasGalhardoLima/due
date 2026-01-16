import { z } from 'zod'
import prisma from '../../utils/prisma'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

export default defineEventHandler(async (event) => {
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

  // Check if category already exists (case-insensitive)
  const existing = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  })

  if (existing) {
    return existing
  }

  const category = await prisma.category.create({
    data: { name }
  })

  return category
})
