import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth || {}

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Check if user already has cards (prevent re-seeding)
  const existingCards = await prisma.creditCard.findFirst({
    where: { userId }
  })

  if (existingCards) {
    return { message: 'User already has data, skipping seed.' }
  }

  const today = new Date()
  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()

  // 1. Create categories
  const categories = [
    { name: 'Alimentacao', color: '#ef4444' },
    { name: 'Transporte', color: '#3b82f6' },
    { name: 'Lazer', color: '#10b981' },
    { name: 'Saude', color: '#f59e0b' },
    { name: 'Assinaturas', color: '#8b5cf6' },
    { name: 'Outros', color: '#6b7280' }
  ]

  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const newCat = await prisma.category.create({
      data: { name: cat.name, color: cat.color, userId }
    })
    categoryMap[cat.name] = newCat.id
  }

  // 2. Create a sample card
  const sampleCard = await prisma.creditCard.create({
    data: {
      name: 'Cartao Principal',
      limit: 5000,
      budget: 3000,
      closingDay: 25,
      dueDay: 1,
      isDefault: true,
      userId
    }
  })

  // 3. Create sample transactions
  // Subscription - Spotify
  await prisma.transaction.create({
    data: {
      description: 'Spotify Family',
      amount: 34.90,
      purchaseDate: new Date(thisYear, thisMonth, 5),
      installmentsCount: 1,
      isSubscription: true,
      active: true,
      lastProcessedDate: new Date(thisYear, thisMonth, 5),
      cardId: sampleCard.id,
      categoryId: categoryMap['Assinaturas'],
      userId,
      installments: {
        create: [{ number: 1, amount: 34.90, dueDate: new Date(thisYear, thisMonth, 25) }]
      }
    }
  })

  // One-time expense - Alimentacao
  await prisma.transaction.create({
    data: {
      description: 'Supermercado',
      amount: 450,
      purchaseDate: new Date(thisYear, thisMonth, 10),
      installmentsCount: 1,
      cardId: sampleCard.id,
      categoryId: categoryMap['Alimentacao'],
      userId,
      installments: {
        create: [{ number: 1, amount: 450, dueDate: new Date(thisYear, thisMonth, 25) }]
      }
    }
  })

  // Installment purchase - Electronics
  await prisma.transaction.create({
    data: {
      description: 'Fone Bluetooth',
      amount: 600,
      purchaseDate: new Date(thisYear, thisMonth - 1, 15),
      installmentsCount: 6,
      cardId: sampleCard.id,
      categoryId: categoryMap['Lazer'],
      userId,
      installments: {
        create: Array.from({ length: 6 }).map((_, i) => ({
          number: i + 1,
          amount: 100,
          dueDate: new Date(thisYear, thisMonth - 1 + i, 25)
        }))
      }
    }
  })

  // Gas/Transport
  await prisma.transaction.create({
    data: {
      description: 'Combustivel',
      amount: 280,
      purchaseDate: new Date(thisYear, thisMonth, 8),
      installmentsCount: 1,
      cardId: sampleCard.id,
      categoryId: categoryMap['Transporte'],
      userId,
      installments: {
        create: [{ number: 1, amount: 280, dueDate: new Date(thisYear, thisMonth, 25) }]
      }
    }
  })

  // Restaurant
  await prisma.transaction.create({
    data: {
      description: 'Jantar restaurante',
      amount: 180,
      purchaseDate: new Date(thisYear, thisMonth, 12),
      installmentsCount: 1,
      cardId: sampleCard.id,
      categoryId: categoryMap['Alimentacao'],
      userId,
      installments: {
        create: [{ number: 1, amount: 180, dueDate: new Date(thisYear, thisMonth, 25) }]
      }
    }
  })

  return { message: 'Sample data created successfully!' }
})
