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

  console.log('Seeding categories...')
  for (const name of categories) {
    const existing = await prisma.category.findFirst({ where: { name } })
    if (!existing) {
      await prisma.category.create({ data: { name } })
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
