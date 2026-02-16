import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const categoryId = getRouterParam(event, 'categoryId')

  // Verify category ownership
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
  })

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: 'Category not found' })
  }

  // Delete budget if it exists
  await prisma.categoryBudget.deleteMany({
    where: { categoryId: categoryId!, userId },
  })

  return { success: true }
})
