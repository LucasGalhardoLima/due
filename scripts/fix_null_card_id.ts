import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for transactions without cardId using Raw SQL...')
  
  // Get a default card ID using Prisma first
  const defaultCard = await prisma.creditCard.findFirst()
  if (!defaultCard) {
    console.error('No CreditCard found to use as default.')
    return
  }

  console.log(`Updating transactions to use cardId: ${defaultCard.id} (${defaultCard.name})...`)

  // Use Raw SQL to bypass Prisma schema validation for NULL values
  const count = await prisma.$executeRaw`
    UPDATE "Transaction" 
    SET "cardId" = ${defaultCard.id} 
    WHERE "cardId" IS NULL
  `

  console.log(`Successfully updated ${count} transactions using Raw SQL.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
