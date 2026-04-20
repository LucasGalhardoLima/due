import { Prisma } from '@prisma/client'
import type Stripe from 'stripe'

/** Extract current_period_end from the first subscription item (Stripe v20+) */
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const periodEnd = sub.items.data[0]?.current_period_end
  return periodEnd ? new Date(periodEnd * 1000) : null
}

export default defineEventHandler(async (event) => {
  const stripe = getStripe()
  const config = useRuntimeConfig()

  const body = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!body || !sig) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body or signature' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, config.stripeWebhookSecret)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid signature' })
  }

  // Idempotency: mark event as processing before any business logic to prevent
  // TOCTOU race when Stripe retries while a prior invocation is still executing.
  // The @id unique constraint ensures a concurrent duplicate insert throws P2002.
  try {
    await prisma.processedStripeEvent.create({ data: { id: stripeEvent.id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { received: true, skipped: true }
    }
    throw err
  }

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription && session.customer) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price.id
        const tier = priceId ? resolveTierFromPriceId(priceId) : null
        const periodEnd = getPeriodEnd(sub)

        if (tier && periodEnd) {
          const user = await prisma.user.findUnique({
            where: { stripeCustomerId: session.customer as string },
          })
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                tier,
                stripeSubscriptionId: sub.id,
                stripePriceId: priceId,
                stripeCurrentPeriodEnd: periodEnd,
              },
            })
          }
        }
      }
      break
    }

    case 'invoice.paid': {
      const invoice = stripeEvent.data.object as unknown as Record<string, unknown>
      const subscriptionId = invoice.subscription as string | undefined
      const customerId = invoice.customer as string | undefined
      if (subscriptionId && customerId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const periodEnd = getPeriodEnd(sub)
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        })
        if (user && periodEnd) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripeCurrentPeriodEnd: periodEnd,
            },
          })
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      if (subscription.customer) {
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: subscription.customer as string },
        })
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tier: 'free',
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
            },
          })
        }
      }
      break
    }
  }

  return { received: true }
})
