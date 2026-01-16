import { z } from 'zod'
import prisma from '../../utils/prisma'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const result = updateCategorySchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: result.error.errors,
    })
  }

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing ID',
    })
  }

  // Verify ownership before update
  const existing = await prisma.category.findFirst({
    where: { id, userId }
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Category not found',
    })
  }

  const { name } = result.data

  const category = await prisma.category.update({
    where: { id },
    data: { name }
  })

  return category
})
