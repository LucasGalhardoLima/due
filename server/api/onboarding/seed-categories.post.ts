import prisma from '../../utils/prisma'

const DEFAULT_CATEGORIES = [
  { emoji: '🍔', name: 'Alimentação', color: '#8FE6D2' },
  { emoji: '🚗', name: 'Transporte', color: '#64CCB8' },
  { emoji: '🎮', name: 'Lazer', color: '#BFF5E8' },
  { emoji: '💊', name: 'Saúde', color: '#9B8CEA' },
  { emoji: '📱', name: 'Assinaturas', color: '#7561D8' },
  { emoji: '📦', name: 'Outros', color: '#4E3EA8' },
]

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const existingCount = await prisma.category.count({ where: { userId } })

  if (existingCount > 0) {
    const existing = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
    return { created: false, categories: existing }
  }

  const categories = await prisma.$transaction(
    DEFAULT_CATEGORIES.map((cat) =>
      prisma.category.create({
        data: {
          name: cat.name,
          color: cat.color,
          emoji: cat.emoji,
          userId,
        },
      })
    )
  )

  return { created: true, categories }
})
