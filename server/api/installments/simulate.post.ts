import { z } from 'zod'
import { generateText } from 'ai'
import { gateway } from '../../utils/ai'
import { FinanceUtils } from '../../utils/finance'
import prisma from '../../utils/prisma'
import { getUser } from '../../utils/session'
import { startOfMonth, endOfMonth, addMonths, getYear, getMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { moneyToCents, moneyToNumber } from '../../utils/money'
import { parseJsonWithSchema } from '../../utils/ai-guard'
import { enforceRateLimit } from '../../utils/ai-rate-limit'

const bodySchema = z.object({
  amount: z.number().positive(),
  installments: z.number().int().min(1).max(24),
  cardId: z.string().optional()
})

interface TimelineMonth {
  year: number
  month: number
  label: string
  totalCommitted: number
  limitUsagePercent: number
  status: 'safe' | 'warning' | 'danger'
}

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  enforceRateLimit(`ai:installments-simulate:${userId}`, 20, 10 * 60 * 1000)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
  }

  const { amount, installments, cardId } = result.data

  // 1. Fetch Context
  // We need current installments for next 12 months to build "Before" timeline
  const now = new Date()
  const startDate = startOfMonth(now)
  const endDate = endOfMonth(addMonths(now, 11))

  const currentInstallments = await prisma.installment.findMany({
    where: {
      transaction: { userId, ...(cardId ? { cardId } : {}) },
      dueDate: { gte: startDate, lte: endDate }
    },
    include: {
      transaction: { select: { card: { select: { limit: true, closingDay: true, dueDay: true } } } }
    }
  })

  // Get Card Details for limit and closing day (if cardId provided, else find first or avg)
  let cardLimit = 0
  let closingDay = 10 
  let dueDay = 15

  if (cardId) {
    const card = await prisma.creditCard.findUnique({ where: { id: cardId } })
    if (card) {
      cardLimit = moneyToNumber(card.limit)
      closingDay = card.closingDay
      dueDay = card.dueDay
    }
  } else if (currentInstallments.length > 0) {
    // Fallback to first found card info
    const first = currentInstallments[0]!.transaction.card
    cardLimit = moneyToNumber(first.limit)
    closingDay = first.closingDay
    dueDay = first.dueDay
  } else {
    // Fallback if no data at all
    const card = await prisma.creditCard.findFirst({ where: { userId } })
    if (card) {
      cardLimit = moneyToNumber(card.limit)
      closingDay = card.closingDay
      dueDay = card.dueDay
    }
  }

  // 2. Build "Before" Timeline
  const monthsMap = new Map<string, TimelineMonth>()
  
  // Init
  for (let i = 0; i < 12; i++) {
    const d = addMonths(startDate, i)
    const key = `${getYear(d)}-${getMonth(d)}`
    const monthName = format(d, 'MMM', { locale: ptBR })
    
    monthsMap.set(key, {
      year: getYear(d),
      month: getMonth(d),
      label: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${format(d, 'yy')}`,
      totalCommitted: 0,
      limitUsagePercent: 0,
      status: 'safe'
    })
  }

  // Fill Before
  for (const inst of currentInstallments) {
    const key = `${getYear(inst.dueDate)}-${getMonth(inst.dueDate)}`
    if (monthsMap.has(key)) {
      const m = monthsMap.get(key)!
      m.totalCommitted += moneyToCents(inst.amount) / 100
    }
  }

  // Update percentages
  const beforeTimeline = Array.from(monthsMap.values()).map(m => {
    const p = cardLimit > 0 ? (m.totalCommitted / cardLimit) * 100 : 0
    return {
      ...m,
      limitUsagePercent: p,
      status: p > 80 ? 'danger' : p > 50 ? 'warning' : 'safe'
    } as TimelineMonth
  })

  // 3. Generate Hypothetical Installments
  const newInstallments = FinanceUtils.generateInstallments(
    amount,
    installments,
    now,
    closingDay,
    dueDay
  )

  // 4. Build "After" Timeline (Clone before logic)
  // We can clone the map or just add to values.
  // Let's create a new map to be safe.
  const afterMap = new Map<string, TimelineMonth>()
  
  // Copy 'before' state
  for (const [key, val] of monthsMap.entries()) {
    afterMap.set(key, { ...val }) // Clone object
  }

  // Add new installments
  for (const newInst of newInstallments) {
    const key = `${getYear(newInst.dueDate)}-${getMonth(newInst.dueDate)}`
    if (afterMap.has(key)) {
      const m = afterMap.get(key)!
      m.totalCommitted += newInst.amount
    }
  }

  // Finalize After Timeline
  const afterTimeline: TimelineMonth[] = []
  const warnings: string[] = []
  let peakMonth = { label: '', totalBefore: 0, totalAfter: 0, usagePercentAfter: 0 }

  for (const [key, m] of afterMap.entries()) {
    const p = cardLimit > 0 ? (m.totalCommitted / cardLimit) * 100 : 0
    m.limitUsagePercent = p
    m.status = p > 80 ? 'danger' : p > 50 ? 'warning' : 'safe'
    
    if (p > 80) warnings.push(m.label)
    
    if (m.totalCommitted > peakMonth.totalAfter) {
      const beforeM = monthsMap.get(key)!
      peakMonth = {
        label: m.label,
        totalBefore: beforeM.totalCommitted,
        totalAfter: m.totalCommitted,
        usagePercentAfter: p
      }
    }
    
    afterTimeline.push(m)
  }

  // Calculate monthly impact (avg)
  const monthlyImpact = amount / installments

  // 5. Phase 2: AI Evaluation
  const aiPrompt = `
  Analise esta simulação de compra parcelada:
  - Valor: R$ ${amount.toFixed(2)} em ${installments}x de R$ ${monthlyImpact.toFixed(2)}
  - Limite do Cartão: R$ ${cardLimit.toFixed(2)}
  
  Impacto no cronograma (Timeline 12 meses):
  - Compromisso MÁXIMO atingido: Mês ${peakMonth.label} com ${peakMonth.usagePercentAfter.toFixed(1)}% do limite tomado (R$ ${peakMonth.totalAfter.toFixed(2)}).
  - Aumento de compromisso nesse pico: +R$ ${(peakMonth.totalAfter - peakMonth.totalBefore).toFixed(2)}.
  - Meses críticos (>80%): ${warnings.join(', ') || 'Nenhum'}.

  Responda estritamente em JSON:
  {
    "viable": boolean, // true se não estoura limite drasticamente ou compromete saúde
    "impactScore": number, // 0-10 (0=sem impacto, 10=crítico)
    "recommendation": "string curta (max 150 chars)",
    "bestTiming": "string opcional (sugira outro prazo ou esperar X meses se for ruim)"
  }
  `

  let evaluation = {
    viable: true,
    impactScore: 0,
    recommendation: 'Compra segura baseada nos dados disponíveis.',
    bestTiming: undefined as string | undefined
  }

  try {
    const { text } = await generateText({
      model: gateway('gpt-4o-mini'),
      system: 'Você é um assistente financeiro lógico e direto. Responda apenas JSON.',
      prompt: aiPrompt,
      temperature: 0.5,
      maxTokens: 500
    })
    evaluation = parseJsonWithSchema(text, z.object({
      viable: z.boolean(),
      impactScore: z.number(),
      recommendation: z.string(),
      bestTiming: z.string().optional()
    }))
  } catch (e) {
    console.error('AI Eval Failed', e)
    // Fallback based on rules
    if (peakMonth.usagePercentAfter > 100) {
      evaluation.viable = false
      evaluation.impactScore = 10
      evaluation.recommendation = 'Esta compra excede o seu limite.'
    } else if (peakMonth.usagePercentAfter > 80) {
      evaluation.viable = true
      evaluation.impactScore = 8
      evaluation.recommendation = 'Atenção: Seu limite ficará muito comprometido.'
    }
  }

  return {
    timeline: {
      before: beforeTimeline,
      after: afterTimeline,
      monthlyImpact,
      peakMonth,
      warnings
    },
    evaluation
  }
})
