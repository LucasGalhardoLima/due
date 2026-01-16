import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing ID',
    })
  }

  // Find the category ensuring it belongs to the user
  const category = await prisma.category.findFirst({
    where: { id, userId }
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

  // Find or create "Outros" category for this user
  let defaultCat = await prisma.category.findFirst({
    where: { 
      name: { equals: 'Outros', mode: 'insensitive' },
      userId 
    }
  })

  if (!defaultCat) {
      defaultCat = await prisma.category.create({
          data: { name: 'Outros', userId }
      })
  }

  // Reassign transactions to "Outros" before deleting
  await prisma.transaction.updateMany({
    where: { categoryId: id, userId },
    data: { categoryId: defaultCat.id }
  })

  // Delete the category
  await prisma.category.delete({
    where: { id } // Unique ID is sufficient, but ownership was verified above
  })

  return { success: true }
})
