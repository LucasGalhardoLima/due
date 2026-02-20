export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)

  if (!appUser.stripeCustomerId) {
    throw createError({ statusCode: 400, statusMessage: 'No active subscription' })
  }

  const stripe = getStripe()
  const origin = getRequestURL(event).origin

  const session = await stripe.billingPortal.sessions.create({
    customer: appUser.stripeCustomerId,
    return_url: `${origin}/dashboard`,
  })

  return { url: session.url }
})
