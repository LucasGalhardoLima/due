import { z } from 'zod'
import { startOfMonth, endOfMonth, addMonths, isBefore, getYear, getMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import prisma from '../../utils/prisma'
import { getUser } from '../../utils/session'

// Optional cardId to filter health by specific card
const querySchema = z.object({
  cardId: z.string().optional()
})

interface LimitRelease {
  month: number
  year: number
  label: string
  committedAmount: number
  releasedAmount: number
  cumulativeReleased: number
}

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, (body) => querySchema.parse(body))
  const { cardId } = query
  const { userId } = getUser(event)

  const now = new Date()
  const startCurrentMonth = startOfMonth(now)
  
  // 1. Fetch all installments from now onwards (active plans)
  // We need future installments to calculate "active plans" and "limit release"
  const futureInstallments = await prisma.installment.findMany({
    where: {
      transaction: {
        userId,
        ...(cardId ? { cardId } : {})
      },
      dueDate: {
        gte: startCurrentMonth
      }
    },
    include: {
      transaction: {
        select: {
          id: true,
          installmentsCount: true,
          card: {
            select: { limit: true }
          }
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  })

  // Get total limit
  let totalLimit = 0
  if (cardId) {
    const card = await prisma.creditCard.findUnique({ where: { id: cardId } })
    if (card) totalLimit = card.limit
  } else {
    const cards = await prisma.creditCard.findMany({ where: { userId } })
    totalLimit = cards.reduce((sum: number, c) => sum + c.limit, 0)
  }

  // 2. Metrics Calculation
  
  // Active Plans: distinct transactionIds in future installments
  const activePlanIds = new Set(futureInstallments.map((i: any) => i.transactionId))
  const activeCount = activePlanIds.size
  
  // Calculate monthly commitment for current month, next month, etc.
  // We need next 12 months for Limit Release Projection
  const monthlyCommitments = new Map<string, number>()
  
  // Initialize next 12 months (including current)
  for (let i = 0; i < 13; i++) {
    const d = addMonths(startCurrentMonth, i)
    const key = `${getYear(d)}-${getMonth(d)}`
    monthlyCommitments.set(key, 0)
  }

  for (const inst of futureInstallments) {
    const key = `${getYear(inst.dueDate)}-${getMonth(inst.dueDate)}`
    if (monthlyCommitments.has(key)) {
      monthlyCommitments.set(key, monthlyCommitments.get(key)! + inst.amount)
    }
  }

  const currentMonthKey = `${getYear(startCurrentMonth)}-${getMonth(startCurrentMonth)}`
  const currentMonthlyCommitment = monthlyCommitments.get(currentMonthKey) || 0
  
  // 3. Health Score Algorithm
  let score = 100
  const insights: string[] = []

  // -5 per active installment plan above threshold of 5
  if (activeCount > 5) {
    const penalty = (activeCount - 5) * 5
    score -= penalty
    insights.push(`${activeCount} parcelamentos ativos (ideal: até 5).`)
  }

  // -20 if monthly commitment > 50% of limit, -30 if > 80%
  // Note: These do not stack in the prompt description logic usually, but let's follow strictly:
  // "-20 if > 50%, -30 if > 80%". Usually means max penalty. 
  // Let's assume if > 80%, we apply -30. If > 50% but <= 80%, -20.
  
  let commitmentPercent = 0
  if (totalLimit > 0) {
    commitmentPercent = (currentMonthlyCommitment / totalLimit) * 100
  }

  if (commitmentPercent > 80) {
    score -= 30
    insights.push(`Comprometimento mensal crítico (${commitmentPercent.toFixed(1)}%).`)
  } else if (commitmentPercent > 50) {
    score -= 20
    insights.push(`Comprometimento mensal alto (${commitmentPercent.toFixed(1)}%).`)
  }

  // +10 if installment count is decreasing month-over-month
  // Compare current month count vs next month count?
  // Or trend over multiple months? 
  // "decreasing month-over-month". Let's compare Month 0 vs Month 1.
  const nextMonthKey = `${getYear(addMonths(startCurrentMonth, 1))}-${getMonth(addMonths(startCurrentMonth, 1))}`
  const currentMonthCount = futureInstallments.filter((i: any) => {
    return getYear(i.dueDate) === getYear(startCurrentMonth) && getMonth(i.dueDate) === getMonth(startCurrentMonth)
  }).length
  const nextMonthCount = futureInstallments.filter((i: any) => {
    return getYear(i.dueDate) === getYear(addMonths(startCurrentMonth, 1)) && getMonth(i.dueDate) === getMonth(addMonths(startCurrentMonth, 1))
  }).length

  if (nextMonthCount < currentMonthCount) {
    score += 10
    insights.push('Tendência de queda no número de parcelas.')
  }

  // +5 per installment plan ending within 2 months
  // Find transactions where the LAST installment is within next 2 months.
  // We need to know the last installment date for each active transaction.
  // We can group futureInstallments by transactionId and find max date.
  const planEndDates = new Map<string, Date>()
  for (const inst of futureInstallments) {
    if (!planEndDates.has(inst.transactionId) || inst.dueDate > planEndDates.get(inst.transactionId)!) {
      planEndDates.set(inst.transactionId, inst.dueDate)
    }
  }

  const twoMonthsFromNow = endOfMonth(addMonths(startCurrentMonth, 2))
  let endingSoonCount = 0
  for (const [_, endDate] of planEndDates) {
    if (isBefore(endDate, twoMonthsFromNow)) {
      endingSoonCount++
    }
  }
  
  if (endingSoonCount > 0) {
    score += (endingSoonCount * 5)
    insights.push(`${endingSoonCount} parcelamento(s) terminando em breve.`)
  }

  // Clamp Score
  score = Math.max(0, Math.min(100, score))
  
  let scoreLabel: 'Saudável' | 'Atenção' | 'Crítico' = 'Saudável'
  if (score < 50) scoreLabel = 'Crítico'
  else if (score < 80) scoreLabel = 'Atenção'

  // 4. Limit Release Projection
  // For each of next 12 months, calculate committedAmount and releasedAmount
  // releasedAmount = current month total (base) - that month's total
  // "current month total" usually means the STARTING point (Month 0).
  const limitReleaseProjection: LimitRelease[] = []
  const baseCommitment = currentMonthlyCommitment

  for (let i = 0; i < 12; i++) {
    const d = addMonths(startCurrentMonth, i)
    const key = `${getYear(d)}-${getMonth(d)}`
    const committed = monthlyCommitments.get(key) || 0
    
    // Released is how much "space" opens up relative to now.
    // If committed is HIGHER than now (e.g. accumulating more), released is 0 or negative.
    // Usually "Limit Release" implies we want to see how much of the CURRENT debt goes away.
    // So if I owe 1000 now, and next month I owe 800 (of the OLD debt + new debt?), 
    // strictly speaking "limit release" usually tracks "how much of TODAY's active plans drops off".
    // But the prompt says "current month total - that month's total". 
    // Let's stick to that simple formula: baseCommitment - committed.
    
    const released = Math.max(0, baseCommitment - committed)
    const cumulativeReleased = released // If it means cumulative over time? 
    // Actually "cumulative" usually means Sum(released-prev). 
    // But here "releasedAmount" = "Total Now - Total Then". That IS the cumulative amount freed relative to now.
    
    const monthName = format(d, 'MMM', { locale: ptBR })
    const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`

    limitReleaseProjection.push({
      month: getMonth(d),
      year: getYear(d),
      label,
      committedAmount: committed,
      releasedAmount: released,
      cumulativeReleased: released 
    })
  }

  return {
    score,
    scoreLabel,
    activeCount,
    healthyThreshold: 5,
    totalMonthlyCommitment: currentMonthlyCommitment,
    limitReleaseProjection,
    insights
  }
})
