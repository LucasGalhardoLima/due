export const TIERS = ['free', 'plus', 'pro'] as const
export type Tier = (typeof TIERS)[number]
export const SYSADMIN_CLERK_ID = process.env.SYSADMIN_CLERK_ID || ''

// Fail loudly in production if SYSADMIN_CLERK_ID is not configured
if (process.env.NODE_ENV === 'production' && !SYSADMIN_CLERK_ID) {
  console.warn('[tier-config] SYSADMIN_CLERK_ID is not set — admin endpoints will be inaccessible')
}

export interface TierLimits {
  // Count-based limits (null = unlimited)
  maxCards: number | null
  maxCategories: number | null
  maxCategoryBudgets: number | null
  maxSavingsGoals: number | null
  projectionMonths: number
  // Monthly usage limits (null = unlimited)
  csvImportsPerMonth: number | null
  aiInsightsPerMonth: number | null
  simulationsPerMonth: number | null
  auditsPerMonth: number | null
  // Boolean feature gates
  tags: boolean
  categorizationRules: boolean
  categoryHierarchy: boolean
  budgetRollover: boolean
  recurring: boolean
  cashFlow: boolean
  proactiveAdvisor: boolean
  paretoAnalysis: boolean
  aiInstallmentOptimizer: boolean
  aiAutoParse: boolean
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxCards: 1,
    maxCategories: 10,
    maxCategoryBudgets: 5,
    maxSavingsGoals: 0,
    projectionMonths: 3,
    csvImportsPerMonth: 1,
    aiInsightsPerMonth: 3,
    simulationsPerMonth: 0,
    auditsPerMonth: 0,
    tags: false,
    categorizationRules: false,
    categoryHierarchy: false,
    budgetRollover: false,
    recurring: false,
    cashFlow: false,
    proactiveAdvisor: false,
    paretoAnalysis: false,
    aiInstallmentOptimizer: false,
    aiAutoParse: false,
  },
  plus: {
    maxCards: null,
    maxCategories: null,
    maxCategoryBudgets: null,
    maxSavingsGoals: 5,
    projectionMonths: 12,
    csvImportsPerMonth: null,
    aiInsightsPerMonth: 15,
    simulationsPerMonth: 10,
    auditsPerMonth: 1,
    tags: true,
    categorizationRules: true,
    categoryHierarchy: true,
    budgetRollover: true,
    recurring: true,
    cashFlow: true,
    proactiveAdvisor: false,
    paretoAnalysis: false,
    aiInstallmentOptimizer: false,
    aiAutoParse: false,
  },
  pro: {
    maxCards: null,
    maxCategories: null,
    maxCategoryBudgets: null,
    maxSavingsGoals: null,
    projectionMonths: 24,
    csvImportsPerMonth: null,
    aiInsightsPerMonth: null,
    simulationsPerMonth: null,
    auditsPerMonth: null,
    tags: true,
    categorizationRules: true,
    categoryHierarchy: true,
    budgetRollover: true,
    recurring: true,
    cashFlow: true,
    proactiveAdvisor: true,
    paretoAnalysis: true,
    aiInstallmentOptimizer: true,
    aiAutoParse: true,
  },
}

export const TIER_LABELS: Record<Tier, string> = {
  free: 'Gratis',
  plus: 'Plus',
  pro: 'Pro',
}
