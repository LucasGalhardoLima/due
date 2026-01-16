import { z } from 'zod'
import prisma from '../../utils/prisma'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
})

export default defineEventHandler(async (event) => {
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

  const { name } = result.data

  const category = await prisma.category.update({
    where: { id },
    data: { name }
  })

  return category
})
