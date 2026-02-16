import { z } from 'zod'
import prisma from '../../utils/prisma'

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  color: z.string().optional(),
  emoji: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
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

  const { name, color, emoji, parentId } = result.data

  // Tier: category hierarchy gate
  if (parentId !== undefined) {
    enforceTierAccess(checkFeatureAccess(appUser.tier, 'categoryHierarchy'))
  }

  // Atomic ownership-scoped update to prevent TOCTOU race
  const updateResult = await prisma.category.updateMany({
    where: { id, userId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(emoji !== undefined && { emoji }),
      ...(parentId !== undefined && { parentId }),
    }
  })

  if (updateResult.count === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  // Return the updated category
  return prisma.category.findUnique({ where: { id } })
})
