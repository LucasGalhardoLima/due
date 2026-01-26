import { z } from 'zod'
import OpenAI from 'openai'
import prisma from '../../utils/prisma'
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'

const bodySchema = z.object({
  value: z.number().positive(),
  installments: z.number().int().min(1).max(12),
  cardId: z.string().uuid()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!result.success) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Invalid request body',
      data: { errors: result.error.flatten() }
    })
  }

  const { value, installments, cardId } = result.data

  // Verify card ownership
  const card = await prisma.creditCard.findFirst({
    where: { id: cardId, userId }
  })

  if (!card) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Card not found' 
    })
  }

  const now = new Date()
  
  // 1. HISTORICAL ANALYSIS (Last 3 months including current)
  const threeMonthsAgo = subMonths(startOfMonth(now), 2) // -2 because current month is included
  const endOfCurrentMonth = endOfMonth(now)

  const historicalInstallments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: threeMonthsAgo,
        lte: endOfCurrentMonth
      },
      transaction: {
        userId,
        cardId
      }
    },
    include: {
      transaction: {
        include: {
          category: { select: { name: true } }
        }
      }
    }
  })

  // Calculate monthly averages and trends
  const monthlySpending: Record<string, number> = {}
  const categorySpending: Record<string, number> = {}

  historicalInstallments.forEach(inst => {
    const monthKey = `${inst.dueDate.getFullYear()}-${String(inst.dueDate.getMonth() + 1).padStart(2, '0')}`
    monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + inst.amount
    
    const categoryName = inst.transaction.category.name
    categorySpending[categoryName] = (categorySpending[categoryName] || 0) + inst.amount
  })

  const monthlyTotals = Object.values(monthlySpending)
  const avgMonthlySpending = monthlyTotals.length > 0 
    ? monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length 
    : 0

  // Detect trend (simple comparison: first month vs last month)
  const months = Object.keys(monthlySpending).sort()
  let trend = 'STABLE'
  if (months.length >= 2) {
    const firstMonthKey = months[0]
    const lastMonthKey = months[months.length - 1]
    if (firstMonthKey && lastMonthKey) {
      const firstMonth = monthlySpending[firstMonthKey] || 0
      const lastMonth = monthlySpending[lastMonthKey] || 0
      const change = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0
      if (change > 15) trend = 'INCREASING'
      else if (change < -15) trend = 'DECREASING'
    }
  }

  // 2. FUTURE COMMITMENTS (Next 3 months)
  const startOfNextMonth = addMonths(startOfMonth(now), 1)
  const endOfThreeMonthsAhead = endOfMonth(addMonths(now, 3))

  const futureInstallments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: startOfNextMonth,
        lte: endOfThreeMonthsAhead
      },
      transaction: {
        userId,
        cardId
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  })

  // Group future commitments by month
  const futureCommitments: number[] = [0, 0, 0] // Next 3 months
  futureInstallments.forEach(inst => {
    const monthsDiff = Math.floor(
      (inst.dueDate.getTime() - startOfNextMonth.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    if (monthsDiff >= 0 && monthsDiff < 3) {
      futureCommitments[monthsDiff]! += inst.amount // Non-null assertion: index is guaranteed to exist
    }
  })

  // 3. CURRENT STATE
  const lastMonthKey = months[months.length - 1]
  const currentMonthSpending = lastMonthKey ? (monthlySpending[lastMonthKey] || 0) : 0
  const availableCredit = card.limit - currentMonthSpending
  const installmentAmount = value / installments

  // Top spending categories
  const topCategories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }))

  // 4. PREPARE AI PROMPT
  const aiPrompt = `Você é um consultor financeiro conservador. Analise:

HISTÓRICO (últimos 3 meses):
- Média mensal: R$ ${avgMonthlySpending.toFixed(2)}
- Tendência: ${trend === 'INCREASING' ? 'crescente ⬆️' : trend === 'DECREASING' ? 'decrescente ⬇️' : 'estável ➡️'}
- Categorias dominantes: ${topCategories.map(c => `${c.name} (R$ ${c.amount.toFixed(2)})`).join(', ') || 'Nenhuma'}

COMPROMISSOS FUTUROS (próximos 3 meses no cartão ${card.name}):
- Mês 1: R$ ${(futureCommitments[0] || 0).toFixed(2)} comprometido
- Mês 2: R$ ${(futureCommitments[1] || 0).toFixed(2)} comprometido
- Mês 3: R$ ${(futureCommitments[2] || 0).toFixed(2)} comprometido

LIMITES DO CARTÃO:
- Limite total: R$ ${card.limit.toFixed(2)}
- Disponível agora: R$ ${availableCredit.toFixed(2)}
${card.budget ? `- Meta de gastos: R$ ${card.budget.toFixed(2)}` : ''}

COMPRA PROPOSTA:
- Valor total: R$ ${value.toFixed(2)}
- Parcelas: ${installments}x de R$ ${installmentAmount.toFixed(2)}
- Impacto mensal: ${installments} meses consecutivos de R$ ${installmentAmount.toFixed(2)}

MISSÃO: Avalie a viabilidade desta compra considerando:
1. Se o usuário tem crédito disponível
2. Se a compra respeita a meta de gastos (se definida)
3. Como essa compra afetará os próximos ${installments} meses
4. Se há um momento melhor para fazer essa compra

Responda APENAS com JSON válido neste formato exato:
{
  "viability": "VIABLE" | "NOT_VIABLE" | "MODERATE_RISK",
  "reasoning": "Explicação clara e objetiva do por quê (máx 2 frases)",
  "impact": "Como essa compra afetará as próximas faturas de forma específica",
  "bestTiming": "Se não for VIABLE, quando seria melhor (ou null se for VIABLE)",
  "alternatives": ["Sugestão prática 1", "Sugestão prática 2"]
}`

  // 5. CALL OPENAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor financeiro conservador que fornece análises objetivas e práticas em português do Brasil. Sempre responda em JSON válido.'
        },
        { role: 'user', content: aiPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5, // Lower temperature for more consistent, conservative advice
      max_tokens: 800
    })

    const messageContent = completion.choices[0]?.message?.content
    if (!messageContent) {
      throw new Error('No response from AI')
    }

    const analysis = JSON.parse(messageContent)

    return {
      success: true,
      analysis: {
        viability: analysis.viability,
        reasoning: analysis.reasoning,
        impact: analysis.impact,
        bestTiming: analysis.bestTiming || null,
        alternatives: analysis.alternatives || []
      },
      metadata: {
        avgMonthlySpending,
        futureCommitments,
        availableCredit,
        cardName: card.name,
        trend
      }
    }
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar análise de compra',
      data: { error: error.message }
    })
  }
})
