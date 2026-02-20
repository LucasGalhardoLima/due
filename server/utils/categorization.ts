import prisma from './prisma'

interface CategorizationRule {
  pattern: string
  isRegex: boolean
  categoryId: string
}

/**
 * Match a transaction description against user's categorization rules.
 * Returns the categoryId if a rule matches, otherwise null.
 */
export async function matchCategorizationRule(
  userId: string,
  description: string
): Promise<string | null> {
  const rules = await prisma.categorizationRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }, // First created rules take priority
  })

  const normalizedDesc = description.toLowerCase().trim()

  for (const rule of rules) {
    if (rule.isRegex) {
      try {
        const regex = new RegExp(rule.pattern, 'i')
        if (regex.test(description)) return rule.categoryId
      } catch {
        // Skip invalid regex rules
        continue
      }
    } else {
      // Simple substring match (case-insensitive)
      if (normalizedDesc.includes(rule.pattern.toLowerCase().trim())) {
        return rule.categoryId
      }
    }
  }

  return null
}
