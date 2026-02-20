import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const config = useRuntimeConfig()
    if (!config.stripeSecretKey) {
      throw new Error('NUXT_STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(config.stripeSecretKey)
  }
  return _stripe
}

export function resolveTierFromPriceId(priceId: string): 'plus' | 'pro' | null {
  const config = useRuntimeConfig()
  if (priceId === config.stripePlusMonthlyPriceId || priceId === config.stripePlusAnnualPriceId) {
    return 'plus'
  }
  if (priceId === config.stripeProMonthlyPriceId || priceId === config.stripeProAnnualPriceId) {
    return 'pro'
  }
  return null
}
