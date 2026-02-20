import prisma from '../../utils/prisma'
import { SYSADMIN_CLERK_ID } from '#shared/tier-config'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (!SYSADMIN_CLERK_ID || userId !== SYSADMIN_CLERK_ID) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden — sysadmin only' })
  }

  // Count records to migrate
  const toMigrateCount = await prisma.transaction.count({
    where: { userId: 'migration_temp' }
  })

  if (toMigrateCount === 0) {
    return {
      success: true,
      message: 'No data to migrate',
      count: 0
    }
  }

  // Run migration in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Migrate Cards
    const cards = await tx.creditCard.updateMany({
      where: { userId: 'migration_temp' },
      data: { userId }
    })

    // 2. Migrate Categories
    // Note: This might cause conflicts if user already has 'Outros', but updateMany won't fail, just duplicates?
    // A better approach for categories involves deduping, but for MVP/Single User migration:
    const categories = await tx.category.updateMany({
      where: { userId: 'migration_temp' },
      data: { userId }
    })

    // 3. Migrate Transactions
    const transactions = await tx.transaction.updateMany({
      where: { userId: 'migration_temp' },
      data: { userId }
    })

    // 4. Migrate Invoices (if userId was added to schema, currently it's not)
    // If we added userId to Invoice, we'd update it here.
    const invoices = await tx.invoice.updateMany({
       where: { userId: 'migration_temp' },
       data: { userId }
    })

    return {
      cards: cards.count,
      categories: categories.count,
      transactions: transactions.count,
      invoices: invoices.count
    }
  })

  return {
    success: true,
    message: 'Migration successful',
    migrated: result
  }
})
