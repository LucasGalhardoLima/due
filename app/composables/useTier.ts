import { TIER_LIMITS, type Tier, type TierLimits } from '#shared/tier-config'

interface UsageInfo {
  current: number
  limit: number | null
}

interface TierResponse {
  tier: Tier
  stripeCustomerId: string | null
  usage: Record<string, UsageInfo>
}

export function useTier() {
  const tierData = useState<TierResponse | null>('tier-data', () => null)
  const loading = useState('tier-loading', () => false)

  const tier = computed<Tier>(() => tierData.value?.tier ?? 'free')
  const limits = computed<TierLimits>(() => TIER_LIMITS[tier.value])
  const isFree = computed(() => tier.value === 'free')
  const isPlus = computed(() => tier.value === 'plus')
  const isPro = computed(() => tier.value === 'pro')
  const usage = computed(() => tierData.value?.usage ?? {})
  const hasStripe = computed(() => !!tierData.value?.stripeCustomerId)

  function canUse(feature: keyof TierLimits): boolean {
    const val = limits.value[feature]
    if (typeof val === 'boolean') return val
    if (typeof val === 'number') return val > 0
    return true // null = unlimited
  }

  function remaining(feature: string): number | null {
    const u = usage.value[feature]
    if (!u || u.limit === null) return null
    return Math.max(0, u.limit - u.current)
  }

  async function refresh() {
    loading.value = true
    try {
      const data = await $fetch<TierResponse>('/api/user/tier')
      tierData.value = data
    } catch {
      // Silently fail — default to free
    } finally {
      loading.value = false
    }
  }

  // Auto-fetch on first use (client-only)
  if (import.meta.client && tierData.value === null) {
    refresh()
  }

  return { tier, limits, isFree, isPlus, isPro, usage, hasStripe, canUse, remaining, refresh, loading }
}
