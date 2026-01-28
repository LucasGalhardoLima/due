import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DEMO_USER_ID = 'user_demo_test_account'

async function main() {
  console.log('Seeding demo data...')

  // 1. Create Categories for Demo User
  const categories = [
    { name: 'Alimentação', color: '#ef4444' },
    { name: 'Transporte', color: '#3b82f6' },
    { name: 'Lazer', color: '#10b981' },
    { name: 'Saúde', color: '#f59e0b' },
    { name: 'Assinaturas', color: '#8b5cf6' },
    { name: 'Outros', color: '#6b7280' }
  ]

  const categoryMap: Record<string, string> = {}

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: DEMO_USER_ID }
    })
    if (!existing) {
      const newCat = await prisma.category.create({
        data: { name: cat.name, color: cat.color, userId: DEMO_USER_ID }
      })
      categoryMap[cat.name] = newCat.id
    } else {
      categoryMap[cat.name] = existing.id
    }
  }

  // 2. Create Demo Credit Card
  let demoCard = await prisma.creditCard.findFirst({
    where: { name: 'Cartão Demo', userId: DEMO_USER_ID }
  })

  if (!demoCard) {
    demoCard = await prisma.creditCard.create({
      data: {
        name: 'Cartão Demo',
        limit: 5000,
        budget: 3000,
        closingDay: 25,
        dueDay: 1,
        isDefault: true,
        userId: DEMO_USER_ID
      }
    })
  }

  // 3. Create Demo Transactions
  const today = new Date()
  
  // Transaction 1: Grocery (Simple)
  await prisma.transaction.create({
    data: {
      description: 'Supermercado Mensal',
      amount: 450.00,
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), 5),
      installmentsCount: 1,
      cardId: demoCard.id,
      categoryId: categoryMap['Alimentação'],
      userId: DEMO_USER_ID,
      installments: {
        create: [
          { number: 1, amount: 450.00, dueDate: new Date(today.getFullYear(), today.getMonth(), 25) }
        ]
      }
    }
  })

  // Transaction 2: New Smartphone (Installments)
  const smartphoneDate = new Date(today.getFullYear(), today.getMonth() - 1, 15)
  await prisma.transaction.create({
    data: {
      description: 'Smartphone Novo',
      amount: 2400.00,
      purchaseDate: smartphoneDate,
      installmentsCount: 6,
      cardId: demoCard.id,
      categoryId: categoryMap['Outros'],
      userId: DEMO_USER_ID,
      installments: {
        create: Array.from({ length: 6 }).map((_, i) => ({
          number: i + 1,
          amount: 400.00,
          dueDate: new Date(smartphoneDate.getFullYear(), smartphoneDate.getMonth() + i, 25)
        }))
      }
    }
  })

  // Transaction 3: Netflix (Subscription)
  await prisma.transaction.create({
    data: {
      description: 'Netflix',
      amount: 55.90,
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), 1),
      installmentsCount: 1,
      isSubscription: true,
      cardId: demoCard.id,
      categoryId: categoryMap['Assinaturas'],
      userId: DEMO_USER_ID,
      installments: {
        create: [
          { number: 1, amount: 55.90, dueDate: new Date(today.getFullYear(), today.getMonth(), 25) }
        ]
      }
    }
  })

  console.log('Demo data seeded successfully!')
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
