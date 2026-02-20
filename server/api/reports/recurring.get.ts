import { differenceInDays, startOfMonth, endOfMonth, addDays } from 'date-fns'
import prisma from '../../utils/prisma'
import { moneyToNumber } from '../../utils/money'

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(checkFeatureAccess(appUser.tier, 'recurring'))

  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)

  // 1. Fetch all active subscriptions
  const subscriptions = await prisma.transaction.findMany({
    where: {
      userId,
      isSubscription: true,
      active: true,
    },
    include: {
      category: { select: { id: true, name: true, color: true, emoji: true } },
      installments: {
        where: {
          dueDate: { gte: currentMonthStart, lte: addDays(currentMonthEnd, 60) },
        },
        orderBy: { dueDate: 'asc' },
        take: 2, // current + next
      },
    },
    orderBy: { amount: 'desc' },
  })

  // 2. Auto-detect recurring patterns from non-subscription transactions
  // Find transactions with same description, similar amount (±10%), ~30-day interval, 3+ occurrences
  const allTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      isSubscription: false,
      installmentsCount: 1, // single-charge transactions only
    },
    include: {
      category: { select: { id: true, name: true, color: true, emoji: true } },
      installments: {
        orderBy: { dueDate: 'desc' },
        take: 1,
      },
    },
    orderBy: { purchaseDate: 'desc' },
  })

  // Group by normalized description
  const descriptionGroups: Record<string, typeof allTransactions> = {}
  for (const tx of allTransactions) {
    const key = tx.description.toLowerCase().trim()
    if (!descriptionGroups[key]) descriptionGroups[key] = []
    descriptionGroups[key].push(tx)
  }

  // Filter for recurring patterns
  interface DetectedRecurring {
    description: string
    averageAmount: number
    occurrences: number
    lastDate: string
    categoryName: string
    categoryColor: string | null
    categoryEmoji: string | null
    averageInterval: number
  }

  const detected: DetectedRecurring[] = []

  for (const [, txs] of Object.entries(descriptionGroups)) {
    if (txs.length < 3) continue

    // Check amount similarity (±10% from median)
    const amounts = txs.map(tx => moneyToNumber(tx.amount)).sort((a, b) => a - b)
    const median = amounts[Math.floor(amounts.length / 2)]
    const withinRange = amounts.filter(a => Math.abs(a - median) / median <= 0.1)

    if (withinRange.length < 3) continue

    // Check date intervals (~monthly)
    const dates = txs
      .map(tx => tx.installments[0]?.dueDate || tx.purchaseDate)
      .sort((a, b) => a.getTime() - b.getTime())

    const intervals: number[] = []
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i - 1]))
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    // Accept intervals between 20-40 days (roughly monthly)
    if (avgInterval < 20 || avgInterval > 40) continue

    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const lastTx = txs[0]

    detected.push({
      description: lastTx.description,
      averageAmount: Math.round(avgAmount * 100) / 100,
      occurrences: txs.length,
      lastDate: (lastTx.installments[0]?.dueDate || lastTx.purchaseDate).toISOString(),
      categoryName: lastTx.category.name,
      categoryColor: lastTx.category.color,
      categoryEmoji: lastTx.category.emoji,
      averageInterval: Math.round(avgInterval),
    })
  }

  // 3. Build subscription items
  const items = subscriptions.map(sub => {
    const amount = moneyToNumber(sub.amount)
    const currentInstallment = sub.installments.find(
      inst => inst.dueDate >= currentMonthStart && inst.dueDate <= currentMonthEnd
    )
    const nextInstallment = sub.installments.find(
      inst => inst.dueDate > currentMonthEnd
    ) || sub.installments[sub.installments.length - 1]

    return {
      id: sub.id,
      description: sub.description,
      amount,
      categoryName: sub.category.name,
      categoryColor: sub.category.color,
      categoryEmoji: sub.category.emoji,
      paidThisMonth: !!currentInstallment,
      nextDueDate: nextInstallment?.dueDate.toISOString() || null,
      active: sub.active,
      lastProcessedDate: sub.lastProcessedDate?.toISOString() || null,
      daysInactive: sub.lastProcessedDate
        ? differenceInDays(now, sub.lastProcessedDate)
        : differenceInDays(now, sub.createdAt),
    }
  })

  const totalMonthly = items.reduce((sum, item) => sum + item.amount, 0)
  const totalAnnual = totalMonthly * 12

  return {
    subscriptions: items,
    detected,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    totalAnnual: Math.round(totalAnnual * 100) / 100,
    activeCount: items.length,
    detectedCount: detected.length,
  }
})
