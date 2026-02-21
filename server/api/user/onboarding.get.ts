import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const user = await prisma.user.findFirst({
    where: { clerkId: userId },
    select: { onboardingCompletedAt: true, onboardingStep: true },
  })

  return {
    completedAt: user?.onboardingCompletedAt?.toISOString() ?? null,
    step: user?.onboardingStep ?? 0,
  }
})
