import prisma from '../../utils/prisma'
import { serializeDecimals } from '../../utils/money'

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
     return serializeDecimals(transaction)
  } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) throw error
      throw createError({
          statusCode: 500,
          statusMessage: 'Transaction not found or could not be deleted'
      })
  }
})
