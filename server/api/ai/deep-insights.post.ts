import { z } from 'zod'
import { generateText } from 'ai'
import { gateway } from '../../utils/ai'
import prisma from '../../utils/prisma'

const querySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional()
})

export interface DeepInsights {
  trend_analysis: {
    direction: 'crescente' | 'estável' | 'decrescente'
    monthly_change_pct: number
    categories_driving_change: { name: string; change_pct: number }[]
  }
  forecast: {
    next_month_prediction: number
    confidence: number
    factors: string[]
  }
  optimization_opportunities: {
    category: string
    current_spending: number
    potential_saving: number
    difficulty: 'fácil' | 'médio' | 'difícil'
    suggestion: string
  }[]
  health_score: {
    score: number
    factors: { label: string; impact: 'positive' | 'negative' }[]
  }
}

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  const query = getQuery(event)
  const { month, year } = querySchema.parse(query)

  const now = new Date()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  const targetYear = year ? parseInt(year) : now.getFullYear()

  // Calculate 6-month date range (5 months back + current month)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)
  const startDate = new Date(targetYear, targetMonth - 6, 1)

  // Fetch all installments for the 6-month period
  const installments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: startDate,
        lte: endDate
      },
      transaction: {
        userId
      }
    },
    include: {
      transaction: {
        include: {
          category: { select: { name: true } },
          card: { select: { name: true, limit: true, budget: true } }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  })

  // Group installments by month
  const monthlyData: Record<string, {
    total: number
    categories: Record<string, number>
    count: number
  }> = {}

  for (let i = 0; i < 6; i++) {
    const d = new Date(targetYear, targetMonth - 6 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyData[key] = { total: 0, categories: {}, count: 0 }
  }

  for (const inst of installments) {
    const d = new Date(inst.dueDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    if (monthlyData[key]) {
      monthlyData[key].total += inst.amount
      monthlyData[key].count++

      const categoryName = inst.transaction.category.name
      if (!monthlyData[key].categories[categoryName]) {
        monthlyData[key].categories[categoryName] = 0
      }
      monthlyData[key].categories[categoryName] += inst.amount
    }
  }

  // Calculate monthly changes
  const monthKeys = Object.keys(monthlyData).sort()
  const monthlyChanges: { month: string; total: number; change_pct: number | null }[] = []

  for (let i = 0; i < monthKeys.length; i++) {
    const key = monthKeys[i]!
    const prevKey = monthKeys[i - 1]
    const current = monthlyData[key]!.total
    const prev = prevKey ? monthlyData[prevKey]!.total : null

    monthlyChanges.push({
      month: key,
      total: current,
      change_pct: prev !== null && prev > 0 ? ((current - prev) / prev) * 100 : null
    })
  }

  // Calculate category trends (comparing last month to 6-month average)
  const allCategories = new Set<string>()
  Object.values(monthlyData).forEach(m => {
    Object.keys(m.categories).forEach(c => allCategories.add(c))
  })

  const categoryTrends: { name: string; sixMonthAvg: number; lastMonth: number; change_pct: number }[] = []
  const lastMonthKey = monthKeys[monthKeys.length - 1] || ''

  for (const cat of allCategories) {
    const totalAcrossMonths = Object.values(monthlyData).reduce((acc, m) => acc + (m.categories[cat] || 0), 0)
    const sixMonthAvg = totalAcrossMonths / 6
    const lastMonthAmount = lastMonthKey ? (monthlyData[lastMonthKey]?.categories[cat] || 0) : 0

    if (sixMonthAvg > 0) {
      categoryTrends.push({
        name: cat,
        sixMonthAvg,
        lastMonth: lastMonthAmount,
        change_pct: ((lastMonthAmount - sixMonthAvg) / sixMonthAvg) * 100
      })
    }
  }

  categoryTrends.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))

  // Get user context
  const userCards = await prisma.creditCard.findMany({ where: { userId } })
  const totalBudget = userCards.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalLimit = userCards.reduce((acc, c) => acc + c.limit, 0)

  // Future commitments (next 3 months)
  const futureStart = new Date(targetYear, targetMonth, 1)
  const futureEnd = new Date(targetYear, targetMonth + 3, 0)

  const futureInstallments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gte: futureStart,
        lte: futureEnd
      },
      transaction: { userId }
    },
    include: {
      transaction: {
        include: {
          category: { select: { name: true } }
        }
      }
    },
    orderBy: { dueDate: 'asc' }
  })

  // Group future by month
  const futureMonthly: Record<string, number> = {}
  for (const inst of futureInstallments) {
    const d = new Date(inst.dueDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    futureMonthly[key] = (futureMonthly[key] || 0) + inst.amount
  }

  // Build AI prompt with comprehensive data
  const currentMonthTotal = lastMonthKey ? (monthlyData[lastMonthKey]?.total || 0) : 0
  const sixMonthTotal = Object.values(monthlyData).reduce((acc, m) => acc + m.total, 0)
  const sixMonthAverage = sixMonthTotal / 6

  const aiPrompt = `Você é um analista financeiro sênior especializado em finanças pessoais. Realize uma análise profunda dos últimos 6 meses de gastos do usuário.

PERÍODO ANALISADO: ${monthKeys[0]} a ${lastMonthKey}

EVOLUÇÃO MENSAL DOS GASTOS:
${monthlyChanges.map(m => `- ${m.month}: R$ ${m.total.toFixed(2)}${m.change_pct !== null ? ` (${m.change_pct > 0 ? '+' : ''}${m.change_pct.toFixed(1)}% vs mês anterior)` : ''}`).join('\n')}

MÉDIA MENSAL (6 MESES): R$ ${sixMonthAverage.toFixed(2)}
GASTO DO ÚLTIMO MÊS: R$ ${currentMonthTotal.toFixed(2)} (${((currentMonthTotal / sixMonthAverage - 1) * 100).toFixed(1)}% vs média)

TENDÊNCIAS POR CATEGORIA (vs média 6 meses):
${categoryTrends.slice(0, 8).map(c => `- ${c.name}: R$ ${c.lastMonth.toFixed(2)} (${c.change_pct > 0 ? '+' : ''}${c.change_pct.toFixed(1)}% vs média de R$ ${c.sixMonthAvg.toFixed(2)})`).join('\n')}

COMPROMISSOS FUTUROS (PRÓXIMOS 3 MESES):
${Object.entries(futureMonthly).length > 0
    ? Object.entries(futureMonthly).map(([m, v]) => `- ${m}: R$ ${v.toFixed(2)}`).join('\n')
    : 'Nenhum compromisso parcelado detectado.'}

CONTEXTO FINANCEIRO:
- Orçamento Mensal: R$ ${totalBudget > 0 ? totalBudget.toFixed(2) : 'Não definido'}
- Limite Total: R$ ${totalLimit.toFixed(2)}

MISSÃO: Forneça uma análise estratégica profunda em JSON com:
1. TREND_ANALYSIS: Direção geral (crescente/estável/decrescente), variação percentual média, categorias que mais puxam a mudança
2. FORECAST: Previsão para o próximo mês baseada na tendência, com nível de confiança (0-100) e fatores considerados
3. OPTIMIZATION_OPPORTUNITIES: 3-5 oportunidades de economia com categoria, valor atual, economia potencial, dificuldade (fácil/médio/difícil) e sugestão prática
4. HEALTH_SCORE: Pontuação de saúde financeira (0-100) com fatores positivos e negativos

FORMATO DE RESPOSTA (JSON PURO):
{
  "trend_analysis": {
    "direction": "crescente" | "estável" | "decrescente",
    "monthly_change_pct": número,
    "categories_driving_change": [{"name": "categoria", "change_pct": número}]
  },
  "forecast": {
    "next_month_prediction": número em reais,
    "confidence": número 0-100,
    "factors": ["fator 1", "fator 2"]
  },
  "optimization_opportunities": [
    {
      "category": "nome",
      "current_spending": número,
      "potential_saving": número,
      "difficulty": "fácil" | "médio" | "difícil",
      "suggestion": "sugestão prática"
    }
  ],
  "health_score": {
    "score": número 0-100,
    "factors": [{"label": "descrição", "impact": "positive" | "negative"}]
  }
}

Seja preciso, baseie-se nos números reais e dê conselhos acionáveis.`

  try {
    const { text } = await generateText({
      model: gateway('anthropic/claude-opus-4'),
      system: 'Você é um analista financeiro sênior. Responda APENAS em JSON válido, sem blocos de código markdown. Use português do Brasil.',
      prompt: aiPrompt,
      temperature: 0.7,
      maxTokens: 2000,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'deep-insights',
        metadata: {
          userId,
          feature: 'deep-analysis',
          monthsAnalyzed: 6
        }
      }
    })

    // Clean markdown code blocks if present
    const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    const insights: DeepInsights = JSON.parse(cleanedText)

    return {
      success: true,
      insights,
      metadata: {
        periodStart: monthKeys[0],
        periodEnd: lastMonthKey,
        totalAnalyzed: sixMonthTotal,
        monthlyAverage: sixMonthAverage,
        monthlyData: monthlyChanges,
        categoryTrends: categoryTrends.slice(0, 5)
      }
    }
  } catch (error: any) {
    console.error('Deep Insights AI Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao gerar análise profunda',
      data: { error: error.message }
    })
  }
})
