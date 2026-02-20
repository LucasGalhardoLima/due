import { z } from 'zod'
import prisma from '../../utils/prisma'

const bodySchema = z.object({
  pattern: z.string().min(1, 'Padrão é obrigatório'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isRegex: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'categorizationRules'))

  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  // Verify category ownership
  const category = await prisma.category.findFirst({
    where: { id: result.data.categoryId, userId },
  })
  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  // Validate regex if isRegex
  if (result.data.isRegex) {
    try {
      new RegExp(result.data.pattern)
    } catch {
      throw createError({ statusCode: 400, statusMessage: 'Regex inválido' })
    }
  }

  const rule = await prisma.categorizationRule.create({
    data: {
      pattern: result.data.pattern,
      categoryId: result.data.categoryId,
      isRegex: result.data.isRegex ?? false,
      userId,
    },
  })

  return rule
})
