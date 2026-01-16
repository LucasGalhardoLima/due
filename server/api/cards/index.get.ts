// Auto-imported by Nuxt if using named export or if file is named appropriately.
// But we used default export in utils/prisma.ts.
// Let's rely on relative path for safety: '../../utils/prisma'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  return await prisma.creditCard.findMany({
    where: { userId }
  })
})
