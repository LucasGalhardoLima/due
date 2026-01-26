import { z } from 'zod'
import { generateText } from 'ai'
import { gateway } from '../../utils/ai'
import prisma from '../../utils/prisma'

const querySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event) 
  const query = getQuery(event)
  const { month, year } = querySchema.parse(query)
  
  const now = new Date()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  const targetYear = year ? parseInt(year) : now.getFullYear()

  // Define Date Range for "Invoiced Installments" (Current Month)
  const startDate = new Date(targetYear, targetMonth - 1, 1)
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  // 1. Fetch ALL installments due in the current month (matches summary logic)
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
    }
  })

  // 2. Calculate category spending based on these installments
  const categorySpending: Record<string, number> = {}
  let totalSpent = 0
  
  // Get user's global context (limit/budget)
  const userCards = await prisma.creditCard.findMany({ where: { userId } })
  const totalBudget = userCards.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalLimit = userCards.reduce((acc, c) => acc + c.limit, 0)

  for (const inst of installments) {
    const categoryName = inst.transaction.category.name
    
    if (!categorySpending[categoryName]) {
      categorySpending[categoryName] = 0
    }
    categorySpending[categoryName] += inst.amount
    totalSpent += inst.amount
  }

  // 3. Get future commitments (next 3 months) for better advice
  const futureDate = new Date(targetYear, targetMonth + 2, 0) // End of 3 months from now
  const futureInstallments = await prisma.installment.findMany({
    where: {
      dueDate: {
        gt: endDate,
        lte: futureDate
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

  // Prepare data for AI
  const categoryArray = Object.entries(categorySpending)
    .map(([name, amount]) => ({ name, amount, percentage: totalSpent > 0 ? (amount / totalSpent * 100).toFixed(1) : '0' }))
    .sort((a, b) => b.amount - a.amount)

  const aiPrompt = `Você é um consultor financeiro pessoal de elite. Analise os dados reais da fatura do usuário e forneça insights profundos.
  
CONTEXTO DO USUÁRIO (${targetMonth}/${targetYear}):
- Fatura Atual Total: R$ ${totalSpent.toFixed(2)}
- Orçamento Mensal (Meta): R$ ${totalBudget > 0 ? totalBudget.toFixed(2) : 'Não definido'}
- Limite Total de Crédito: R$ ${totalLimit.toFixed(2)}
- Quantidade de Itens na Fatura: ${installments.length}

GASTOS POR CATEGORIA (Onde o dinheiro está indo):
${categoryArray.map(c => `- ${c.name}: R$ ${c.amount.toFixed(2)} (${c.percentage}%)`).join('\n')}

COMPROMISSOS FUTUROS (Próximos 3 meses):
${futureInstallments.length > 0 
  ? futureInstallments.slice(0, 10).map(inst => `- ${inst.transaction.category.name}: R$ ${inst.amount.toFixed(2)} em ${new Date(inst.dueDate).toLocaleDateString('pt-BR')}`).join('\n')
  : 'Nenhum compromisso futuro parcelado detectado.'}

MISSÃO: 
1. Faça um diagnóstico real: O usuário estourou o orçamento? O limite está muito comprometido?
2. Identifique tendências: Há gastos excessivos em categorias não essenciais?
3. Dê 3 ações PRÁTICAS: "Corte X", "Ajuste Y", "Cuidado com Z".
4. Previsão: O próximo mês tende a ser mais leve ou mais pesado baseado nas parcelas?

REGRAS DE RESPOSTA (JSON):
{
  "diagnostico": "Explicação curta e direta sobre a saúde financeira atual.",
  "acoes_imediatas": ["Ação 1 com justificativa", "Ação 2 com justificativa", "Ação 3 com justificativa"],
  "alivio_futuro": "Análise sobre os próximos meses baseada nas parcelas que vão vencer.",
  "alertas": ["Alerta crítico baseado em dados realistas"]
}

Seja honesto, direto e use um tom profissional porém amigável (estilo Due/NuBank).`

  try {
    const { text } = await generateText({
      model: gateway('gpt-4o'),
      system: 'Você é um consultor financeiro especialista em análise de faturas. Responda sempre em JSON válido e português do Brasil. Não use blocos de código markdown, retorne apenas o JSON puro.',
      prompt: aiPrompt,
      temperature: 0.7,
      maxTokens: 1000,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'quick-insights',
        metadata: {
          userId,
          feature: 'monthly-summary'
        }
      }
    })

    // Clean markdown code blocks if present
    const cleanedText = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
    const insights = JSON.parse(cleanedText)

    return {
      success: true,
      insights,
      metadata: {
        totalSpent,
        transactionCount: installments.length,
        topCategories: categoryArray.slice(0, 3)
      }
    }
  } catch (error: any) {
    console.error('AI Gateway Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao gerar insights',
      data: { error: error.message }
    })
  }
})
