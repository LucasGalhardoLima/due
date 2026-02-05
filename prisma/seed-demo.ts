import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const DEMO_USER_ID = 'user_demo_test_account'

async function main() {
  console.log('Cleaning up old demo data...')
  await prisma.installment.deleteMany({ where: { transaction: { userId: DEMO_USER_ID } } })
  await prisma.transaction.deleteMany({ where: { userId: DEMO_USER_ID } })
  await prisma.category.deleteMany({ where: { userId: DEMO_USER_ID } })
  await prisma.creditCard.deleteMany({ where: { userId: DEMO_USER_ID } })

  console.log('Seeding new demo data...')

  // 1. Categories
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
    const newCat = await prisma.category.create({
      data: { name: cat.name, color: cat.color, userId: DEMO_USER_ID }
    })
    categoryMap[cat.name] = newCat.id
  }

  // 2. Card with a tight limit to trigger alerts
  const demoCard = await prisma.creditCard.create({
    data: {
      name: 'Nubank Demo',
      limit: 4000,
      budget: 2500,
      closingDay: 25,
      dueDay: 1,
      isDefault: true,
      userId: DEMO_USER_ID
    }
  })

  const today = new Date()
  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()

  // 3. Subscriptions (Trigger Analysis)
  
  // Netflix - Inactive
  await prisma.transaction.create({
    data: {
      description: 'Netflix Premium',
      amount: 55.90,
      purchaseDate: new Date(thisYear, thisMonth - 4, 1),
      installmentsCount: 1,
      isSubscription: true,
      active: true,
      lastProcessedDate: new Date(thisYear, thisMonth - 3, 1), // 90 days ago
      cardId: demoCard.id,
      categoryId: categoryMap['Assinaturas'],
      userId: DEMO_USER_ID,
      installments: { create: [{ number: 1, amount: 55.90, dueDate: new Date(thisYear, thisMonth - 4, 25) }] }
    }
  })

  // Spotify - Active
  await prisma.transaction.create({
    data: {
      description: 'Spotify Family',
      amount: 34.90,
      purchaseDate: new Date(thisYear, thisMonth, 1),
      installmentsCount: 1,
      isSubscription: true,
      active: true,
      lastProcessedDate: new Date(thisYear, thisMonth, 1),
      cardId: demoCard.id,
      categoryId: categoryMap['Assinaturas'],
      userId: DEMO_USER_ID,
      installments: { create: [{ number: 1, amount: 34.90, dueDate: new Date(thisYear, thisMonth, 25) }] }
    }
  })

  // Deezer - Redundant
  await prisma.transaction.create({
    data: {
      description: 'Deezer Premium',
      amount: 22.90,
      purchaseDate: new Date(thisYear, thisMonth, 5),
      installmentsCount: 1,
      isSubscription: true,
      active: true,
      lastProcessedDate: new Date(thisYear, thisMonth, 5),
      cardId: demoCard.id,
      categoryId: categoryMap['Assinaturas'],
      userId: DEMO_USER_ID,
      installments: { create: [{ number: 1, amount: 22.90, dueDate: new Date(thisYear, thisMonth, 25) }] }
    }
  })

  // 4. Future Crisis (High installment convergence)
  // Let's make June 2026 (or 3-4 months from today) critical
  const _targetMonth = thisMonth + 4
  
  await prisma.transaction.create({
    data: {
      description: 'MacBook Air M3',
      amount: 10000,
      purchaseDate: new Date(thisYear, thisMonth - 1, 10),
      installmentsCount: 12,
      cardId: demoCard.id,
      categoryId: categoryMap['Outros'],
      userId: DEMO_USER_ID,
      installments: {
        create: Array.from({ length: 12 }).map((_, i) => ({
          number: i + 1,
          amount: 10000 / 12,
          dueDate: new Date(thisYear, thisMonth - 1 + i, 25)
        }))
      }
    }
  })

  await prisma.transaction.create({
    data: {
      description: 'Viagem Japão',
      amount: 15000,
      purchaseDate: new Date(thisYear, thisMonth, 15),
      installmentsCount: 10,
      cardId: demoCard.id,
      categoryId: categoryMap['Outros'],
      userId: DEMO_USER_ID,
      installments: {
        create: Array.from({ length: 10 }).map((_, i) => ({
          number: i + 1,
          amount: 1500,
          dueDate: new Date(thisYear, thisMonth + i, 25)
        }))
      }
    }
  })

  // 5. Dangerous Trend (Growth)
  // OCT: 1000, NOV: 1400, DEC: 1800, JAN: 2200
  const trendMonths = [
    { m: thisMonth - 3, amt: 1000 },
    { m: thisMonth - 2, amt: 1400 },
    { m: thisMonth - 1, amt: 1800 },
    { m: thisMonth, amt: 2200 }
  ]

  for (const t of trendMonths) {
    await prisma.transaction.create({
      data: {
        description: `Gastos Variáveis ${t.m}`,
        amount: t.amt,
        purchaseDate: new Date(thisYear, t.m, 10),
        installmentsCount: 1,
        cardId: demoCard.id,
        categoryId: categoryMap['Alimentação'],
        userId: DEMO_USER_ID,
        installments: { create: [{ number: 1, amount: t.amt, dueDate: new Date(thisYear, t.m, 25) }] }
      }
    })
  }

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
