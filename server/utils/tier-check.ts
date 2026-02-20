import { createError } from 'h3'
import { TIER_LIMITS, TIER_LABELS, type Tier, type TierLimits } from '#shared/tier-config'
import { format } from 'date-fns'

// --- Result types ---

interface AccessResult {
  allowed: boolean
  reason?: string
  upgradeRequired?: Tier
}

interface CountLimitResult extends AccessResult {
  limit: number | null
  current: number
}

// --- Boolean feature gate ---

type BooleanFeature = {
  [K in keyof TierLimits]: TierLimits[K] extends boolean ? K : never
}[keyof TierLimits]

export function checkFeatureAccess(tier: Tier, feature: BooleanFeature): AccessResult {
  const limits = TIER_LIMITS[tier]
  if (limits[feature]) {
    return { allowed: true }
  }
  const upgradeRequired = feature in TIER_LIMITS.plus && TIER_LIMITS.plus[feature] ? 'plus' as const : 'pro' as const
  return {
    allowed: false,
    reason: `Recurso "${feature}" nao disponivel no plano ${TIER_LABELS[tier]}`,
    upgradeRequired,
  }
}

// --- Count-based limit ---

type CountFeature = 'maxCards' | 'maxCategories' | 'maxCategoryBudgets' | 'maxSavingsGoals'

export function checkCountLimit(tier: Tier, feature: CountFeature, currentCount: number): CountLimitResult {
  const limit = TIER_LIMITS[tier][feature]
  if (limit === null) {
    return { allowed: true, limit: null, current: currentCount }
  }
  if (currentCount >= limit) {
    const upgradeRequired = TIER_LIMITS.plus[feature] === null || (TIER_LIMITS.plus[feature] !== null && TIER_LIMITS.plus[feature]! > limit) ? 'plus' as const : 'pro' as const
    return {
      allowed: false,
      limit,
      current: currentCount,
      reason: `Limite de ${limit} ${feature.replace('max', '').toLowerCase()} atingido no plano ${TIER_LABELS[tier]}`,
      upgradeRequired,
    }
  }
  return { allowed: true, limit, current: currentCount }
}

// --- Monthly usage counter ---

const USAGE_FEATURE_MAP: Record<string, keyof TierLimits> = {
  ai_insights: 'aiInsightsPerMonth',
  csv_imports: 'csvImportsPerMonth',
  simulations: 'simulationsPerMonth',
  audits: 'auditsPerMonth',
}

export async function checkAndIncrementUsage(
  dbUserId: string,
  tier: Tier,
  feature: string,
): Promise<CountLimitResult> {
  const limitsKey = USAGE_FEATURE_MAP[feature]
  if (!limitsKey) {
    return { allowed: true, limit: null, current: 0 }
  }

  const limit = TIER_LIMITS[tier][limitsKey] as number | null
  const periodKey = format(new Date(), 'yyyy-MM')

  // Get or create counter
  const counter = await prisma.usageCounter.upsert({
    where: { userId_feature_periodKey: { userId: dbUserId, feature, periodKey } },
    create: { userId: dbUserId, feature, periodKey, count: 0 },
    update: {},
  })

  if (limit !== null && counter.count >= limit) {
    const plusLimit = TIER_LIMITS.plus[limitsKey] as number | null
    const upgradeRequired = plusLimit === null || (plusLimit !== null && plusLimit > (limit ?? 0)) ? 'plus' as const : 'pro' as const
    return {
      allowed: false,
      limit,
      current: counter.count,
      reason: `Limite de ${limit} ${feature.replace('_', ' ')} por mes atingido no plano ${TIER_LABELS[tier]}`,
      upgradeRequired,
    }
  }

  // Increment counter
  await prisma.usageCounter.update({
    where: { id: counter.id },
    data: { count: { increment: 1 } },
  })

  return { allowed: true, limit, current: counter.count + 1 }
}

// --- Enforcer: throws 403 if not allowed ---

export function enforceTierAccess(result: AccessResult | CountLimitResult): void {
  if (result.allowed) return

  throw createError({
    statusCode: 403,
    statusMessage: 'Upgrade necessario',
    data: {
      reason: result.reason,
      limit: 'limit' in result ? result.limit : undefined,
      current: 'current' in result ? result.current : undefined,
      upgradeRequired: result.upgradeRequired,
    },
  })
}
