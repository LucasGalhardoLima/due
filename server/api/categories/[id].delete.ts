import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing ID',
    })
  }

  // Find the category
  const category = await prisma.category.findUnique({
    where: { id }
  })

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Category not found',
    })
  }

  // Prevent deleting dedicated "Outros" category if possible
  if (category.name.toLowerCase() === 'outros') {
    throw createError({
      statusCode: 400,
      statusMessage: 'A categoria "Outros" não pode ser excluída.',
    })
  }

  // Find or create "Outros" category
  let defaultCat = await prisma.category.findFirst({
    where: { name: { equals: 'Outros', mode: 'insensitive' } }
  })

  if (!defaultCat) {
      defaultCat = await prisma.category.create({
          data: { name: 'Outros' }
      })
  }

  // Reassign transactions to "Outros" before deleting
  await prisma.transaction.updateMany({
    where: { categoryId: id },
    data: { categoryId: defaultCat.id }
  })

  // Delete the category
  await prisma.category.delete({
    where: { id }
  })

  return { success: true }
})
