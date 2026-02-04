import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const categories = [
    'Alimentação',
    'Transporte',
    'Lazer',
    'Saúde',
    'Educação',
    'Moradia',
    'Assinaturas',
    'Tech',
    'Outros'
  ]

  const defaultUserIds = ['user_demo_test_account', 'user_test']
  const existingUserIds = new Set<string>()

  const cards = await prisma.creditCard.findMany({
    select: { userId: true }
  })
  cards.forEach(c => existingUserIds.add(c.userId))

  const transactions = await prisma.transaction.findMany({
    select: { userId: true }
  })
  transactions.forEach(t => existingUserIds.add(t.userId))

  defaultUserIds.forEach(id => existingUserIds.add(id))

  console.log('Seeding categories per user...')
  for (const userId of existingUserIds) {
    for (const name of categories) {
      const existing = await prisma.category.findFirst({ where: { name, userId } })
      if (!existing) {
        await prisma.category.create({ data: { name, userId } })
      }
    }
  }


}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
