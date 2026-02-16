import { TIER_LIMITS, type Tier } from '#shared/tier-config'
import { format } from 'date-fns'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const periodKey = format(new Date(), 'yyyy-MM')

  // Fetch current period usage counters
  const counters = await prisma.usageCounter.findMany({
    where: { userId: appUser.dbUserId, periodKey },
  })

  const limits = TIER_LIMITS[appUser.tier as Tier]

  const usageMap: Record<string, { current: number; limit: number | null }> = {}
  const features = ['ai_insights', 'csv_imports', 'simulations', 'audits'] as const
  const limitKeys = ['aiInsightsPerMonth', 'csvImportsPerMonth', 'simulationsPerMonth', 'auditsPerMonth'] as const

  for (let i = 0; i < features.length; i++) {
    const counter = counters.find(c => c.feature === features[i])
    usageMap[features[i]] = {
      current: counter?.count ?? 0,
      limit: limits[limitKeys[i]],
    }
  }

  return {
    tier: appUser.tier,
    stripeCustomerId: appUser.stripeCustomerId,
    usage: usageMap,
  }
})
