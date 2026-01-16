import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const id = event.context.params?.id 
  
  if (!id) {
    throw createError({
        statusCode: 400,
        statusMessage: 'ID is required'
    })
  }

  try {
     // Verify ownership first
     const existing = await prisma.transaction.findFirst({
       where: { id, userId }
     })

     if (!existing) {
       throw createError({ statusCode: 404, statusMessage: 'Transaction not found' })
     }

     const transaction = await prisma.transaction.delete({
        where: { id }
     })
     return transaction
  } catch (error: any) {
      if (error.statusCode === 404) throw error
      throw createError({
          statusCode: 500,
          statusMessage: 'Transaction not found or could not be deleted'
      })
  }
})
