import { z } from 'zod'

const bodySchema = z.object({
  tier: z.enum(['plus', 'pro']),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { tier, interval } = result.data
  const config = useRuntimeConfig()
  const stripe = getStripe()

  // Resolve the correct price ID
  const priceMap: Record<string, string> = {
    'plus:monthly': config.stripePlusMonthlyPriceId,
    'plus:annual': config.stripePlusAnnualPriceId,
    'pro:monthly': config.stripeProMonthlyPriceId,
    'pro:annual': config.stripeProAnnualPriceId,
  }
  const priceId = priceMap[`${tier}:${interval}`]

  if (!priceId) {
    throw createError({ statusCode: 400, statusMessage: 'Price not configured for this tier/interval' })
  }

  // Get or create Stripe customer
  let customerId = appUser.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { clerkId: appUser.userId },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: appUser.dbUserId },
      data: { stripeCustomerId: customerId },
    })
  }

  // Create Checkout session
  const origin = getRequestURL(event).origin
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgrade=success`,
    cancel_url: `${origin}/dashboard?upgrade=cancelled`,
    allow_promotion_codes: true,
  })

  return { url: session.url }
})
