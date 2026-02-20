import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)

  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return goals.map((goal) => {
    const targetAmount = moneyToNumber(goal.targetAmount)
    const currentAmount = moneyToNumber(goal.currentAmount)
    const progress = targetAmount > 0
      ? Math.round((currentAmount / targetAmount) * 10000) / 100
      : 0

    return {
      id: goal.id,
      name: goal.name,
      targetAmount,
      currentAmount,
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      progress,
      createdAt: goal.createdAt.toISOString(),
    }
  })
})
