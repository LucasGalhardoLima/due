import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    })
  }

  try {
    // Verify ownership first
    const card = await prisma.creditCard.findFirst({
      where: { id, userId }
    })

    if (!card) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Card not found',
      })
    }

    const deletedCard = await prisma.creditCard.delete({
      where: { id }
    })
    return deletedCard
  } catch (error: any) {
    if (error.statusCode === 404) throw error
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Card could not be deleted',
    })
  }
})
