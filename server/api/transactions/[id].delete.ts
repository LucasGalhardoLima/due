import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id 
  
  if (!id) {
    throw createError({
        statusCode: 400,
        statusMessage: 'ID is required'
    })
  }

  try {
     const transaction = await prisma.transaction.delete({
        where: { id }
     })
     return transaction
  } catch (error) {
      throw createError({
          statusCode: 404,
          statusMessage: 'Transaction not found or could not be deleted'
      })
  }
})
