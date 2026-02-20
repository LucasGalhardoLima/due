import type { H3Event } from 'h3'
import { SYSADMIN_CLERK_ID, type Tier } from '#shared/tier-config'

interface AppUser {
  userId: string // Clerk ID (used on all existing models)
  dbUserId: string // Internal User table ID
  tier: Tier
  stripeCustomerId: string | null
}

export async function getOrCreateUser(event: H3Event): Promise<AppUser> {
  const { userId } = getUser(event)

  // Sysadmin bypass — always Pro
  if (SYSADMIN_CLERK_ID && userId === SYSADMIN_CLERK_ID) {
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, tier: 'pro' },
      update: {},
    })
    return { userId, dbUserId: user.id, tier: 'pro', stripeCustomerId: user.stripeCustomerId }
  }

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId },
    update: {},
  })

  let tier = user.tier as Tier

  // Expired subscription check: downgrade if period ended
  if (tier !== 'free' && user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { tier: 'free', stripePriceId: null, stripeSubscriptionId: null },
    })
    tier = 'free'
  }

  return { userId, dbUserId: user.id, tier, stripeCustomerId: user.stripeCustomerId }
}
