import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'categorizationRules'))

  const rules = await prisma.categorizationRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // Enrich with category info
  const categoryIds = [...new Set(rules.map(r => r.categoryId))]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true, emoji: true },
  })
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]))

  return rules.map(rule => ({
    id: rule.id,
    pattern: rule.pattern,
    isRegex: rule.isRegex,
    categoryId: rule.categoryId,
    categoryName: categoryMap[rule.categoryId]?.name || 'Desconhecida',
    categoryColor: categoryMap[rule.categoryId]?.color || null,
    categoryEmoji: categoryMap[rule.categoryId]?.emoji || null,
    createdAt: rule.createdAt.toISOString(),
  }))
})
