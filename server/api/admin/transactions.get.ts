import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  // Fetch latest 50 transactions based on creation date
  // This is purely for administrative auditing
  const transactions = await prisma.transaction.findMany({
    take: 50,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      card: {
        select: {
          name: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    }
  })

  return transactions
})
