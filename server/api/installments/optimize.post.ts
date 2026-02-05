import { z } from 'zod'
import { generateText } from 'ai'
import { gateway } from '../../utils/ai'
import prisma from '../../utils/prisma'
import { getUser } from '../../utils/session'
import { startOfMonth } from 'date-fns'
import { moneyToCents } from '../../utils/money'
import { parseJsonWithSchema } from '../../utils/ai-guard'
import { enforceRateLimit } from '../../utils/ai-rate-limit'

const bodySchema = z.object({
  cardId: z.string().optional()
})

interface PlanSummary {
  transactionId: string
  description: string
  category: string
  remainingAmount: number
  remainingInstallments: number
  monthlyAmount: number
  lastDueDate: Date
}

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  enforceRateLimit(`ai:installments-optimize:${userId}`, 10, 10 * 60 * 1000)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)
  if (!result.success) throw createError({ statusCode: 400 })

  const { cardId } = result.data

  const now = new Date()
  const startCurrentMonth = startOfMonth(now)

  // Fetch all future installments
  const futureInstallments = await prisma.installment.findMany({
    where: {
      transaction: { userId, ...(cardId ? { cardId } : {}) },
      dueDate: { gte: startCurrentMonth }
    },
    include: {
      transaction: {
        select: {
          id: true,
          description: true,
          category: { select: { name: true } }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  })

  // Aggregate into Plans
  const plansMap = new Map<string, PlanSummary>()

  for (const inst of futureInstallments) {
    if (!plansMap.has(inst.transactionId)) {
      const instAmount = moneyToCents(inst.amount) / 100
      plansMap.set(inst.transactionId, {
        transactionId: inst.transactionId,
        description: inst.transaction.description,
        category: inst.transaction.category.name,
        remainingAmount: 0,
        remainingInstallments: 0,
        monthlyAmount: instAmount, // Approximate, taking first found
        lastDueDate: inst.dueDate
      })
    }
    const p = plansMap.get(inst.transactionId)!
    p.remainingAmount += moneyToCents(inst.amount) / 100
    p.remainingInstallments++
    if (inst.dueDate > p.lastDueDate) p.lastDueDate = inst.dueDate
  }

  const activePlans = Array.from(plansMap.values())
    .sort((a, b) => b.remainingAmount - a.remainingAmount)
  
  if (activePlans.length === 0) {
    return {
      recommendation: {
        type: 'keep_current',
        title: 'Tudo em ordem',
        description: 'Você não possui parcelamentos ativos para otimizar no momento.',
        impact: { monthlySavings: 0, totalSavings: 0, limitFreed: 0, monthsReduced: 0 }
      },
      alternative: null,
      priorityList: []
    }
  }

  // AI Analysis
  const topPlans = activePlans.slice(0, 10) // Limit context
  
  const prompt = `Analise estes parcelamentos ativos (Do maior para menor saldo devedor):
  ${topPlans.map((p, i) => 
    `${i+1}. ${p.description} (${p.category}): Restam R$ ${p.remainingAmount.toFixed(2)} em ${p.remainingInstallments}x de ~R$ ${p.monthlyAmount.toFixed(2)}`
  ).join('\n')}

  Sugira uma estratégia de otimização (antecipar parcelas para liberar limite ou desconto, quitar dívidas pequenas, etc).
  O foco é liberar limite ou reduzir comprometimento mensal futuro.
  
  Responda estritamente em JSON:
  {
    "recommendation": {
      "type": "antecipate" | "pay_full" | "keep_current",
      "title": "Ação Principal (ex: Antecipar iPhone)",
      "description": "Explicação curta (1 frase)",
      "impact": {
        "monthlySavings": number (quanto economiza/libera por mes),
        "totalSavings": number (se houver desconto estimado de 5-10% na antecipação, calcule),
        "limitFreed": number (quanto de limite libera de imediato),
        "monthsReduced": number
      }
    },
    "alternative": { "type": "...", "title": "...", "description": "..." } (opcional),
    "priorityList": [
      { 
        "description": "Nome da transação da lista",
        "priority": "high" | "medium" | "low",
        "reason": "Motivo curto"
      }
    ] (Classifique os top 3-5 que valem a pena mexer)
  }`

  try {
    const { text } = await generateText({
      model: gateway('gpt-4o-mini'),
      system: 'Você é um otimizador financeiro. JSON only.',
      prompt,
      temperature: 0.5,
      maxTokens: 800
    })
    
    const result = parseJsonWithSchema(text, z.object({
      recommendation: z.object({
        type: z.enum(['antecipate', 'pay_full', 'keep_current']),
        title: z.string(),
        description: z.string(),
        impact: z.object({
          monthlySavings: z.number(),
          totalSavings: z.number(),
          limitFreed: z.number(),
          monthsReduced: z.number()
        })
      }),
      alternative: z.object({
        type: z.string(),
        title: z.string(),
        description: z.string()
      }).nullable().optional(),
      priorityList: z.array(z.object({
        description: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        reason: z.string()
      })).optional()
    }))
    
    // Enrich priority list with local data if needed, or trust AI returns matching names
    // We append the original financial data to priority list items for frontend display
    const enrichedList = result.priorityList?.map((item) => {
      const original = activePlans.find(p => p.description.includes(item.description) || item.description.includes(p.description))
      return {
        ...item,
        remainingAmount: original?.remainingAmount || 0,
        remainingInstallments: original?.remainingInstallments || 0,
        monthlyAmount: original?.monthlyAmount || 0
      }
    }) ?? []

    return {
      ...result,
      priorityList: enrichedList
    }

  } catch (e) {
    console.error('Optimizer AI Failed', e)
    return {
      recommendation: {
        type: 'keep_current',
        title: 'Manter como está',
        description: 'Não foi possível gerar uma otimização no momento.',
        impact: { monthlySavings: 0, totalSavings: 0, limitFreed: 0, monthsReduced: 0 }
      },
      alternative: null,
      priorityList: []
    }
  }
})
