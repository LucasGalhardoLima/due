import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    })
  }

  try {
    const deletedCard = await prisma.creditCard.delete({
      where: { id }
    })
    return deletedCard
  } catch (error) {
    throw createError({
      statusCode: 404, // or 500 depending on error, assuming not found or constraint
      statusMessage: 'Card not found or could not be deleted',
    })
  }
})
