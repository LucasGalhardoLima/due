import { z } from 'zod'
import { generateText } from 'ai'
import { gateway } from '../../utils/ai'
import { gatherAdvisorContext } from '../../utils/advisor-context'
import { parseJsonWithSchema } from '../../utils/ai-guard'
import { enforceRateLimit } from '../../utils/ai-rate-limit'
import type { AdvisorResponse } from '#shared/types/api-responses'

const requestSchema = z.object({
  triggerType: z.enum(['morning_check', 'post_transaction', 'pre_fechamento', 'budget_review']),
  cardId: z.string().optional(),
  transactionData: z.object({
    amount: z.number(),
    description: z.string(),
    categoryName: z.string()
  }).optional()
})

const advisorResponseSchema = z.object({
  message: z.string(),
  tone: z.enum(['curious', 'warning', 'congratulatory', 'neutral']),
  action: z.object({
    type: z.enum(['suggestion', 'alert']),
    text: z.string()
  }).nullable().optional(),
  should_display: z.boolean(),
  priority: z.enum(['low', 'medium', 'high'])
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId
  enforceTierAccess(await checkAndIncrementUsage(appUser.dbUserId, appUser.tier, 'ai_insights'))
  enforceRateLimit(`ai:advisor:${userId}`, 30, 60 * 60 * 1000)
  const body = await readBody(event)
  const { triggerType, cardId, transactionData } = requestSchema.parse(body)

  // Gather context
  const context = await gatherAdvisorContext(userId, cardId)

  // Build prompt based on trigger type
  let prompt: string
  let systemPrompt: string

  const baseSystem = `Você é um assistente financeiro pessoal inteligente e amigável (estilo Due/Nubank).
Responda SEMPRE em JSON válido sem blocos de código markdown.
Seja conciso, direto e use tom conversacional brasileiro.
Use emojis com moderação (máximo 1-2 por mensagem).

Formato de resposta obrigatório:
{
  "message": "Sua mensagem aqui (máximo 2 frases)",
  "tone": "curious" | "warning" | "congratulatory" | "neutral",
  "action": { "type": "suggestion" | "alert", "text": "Texto da ação" } | null,
  "should_display": true | false,
  "priority": "low" | "medium" | "high"
}

Regras de tone:
- "curious": quando há algo interessante para explorar
- "warning": quando há risco ou atenção necessária
- "congratulatory": quando o usuário está indo bem
- "neutral": informações gerais

Regras de should_display:
- false se não houver nada relevante a dizer
- true apenas se a mensagem agregar valor real`

  switch (triggerType) {
    case 'morning_check':
    {
      systemPrompt = baseSystem
      prompt = `Analise o resumo dos últimos 7 dias do usuário e dê 1 insight + 1 recomendação em no máximo 2 frases.

CONTEXTO DOS ÚLTIMOS 7 DIAS:
- Total gasto: R$ ${context.recentTransactions.last7Days.total.toFixed(2)}
- Quantidade de gastos: ${context.recentTransactions.last7Days.count}
- Categorias: ${Object.entries(context.recentTransactions.last7Days.byCategory)
  .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
  .join(', ') || 'Nenhum gasto'}

COMPARAÇÃO COM PERÍODO ANTERIOR:
- Mesmo período mês passado: R$ ${context.recentTransactions.samePeriodLastMonth.total.toFixed(2)}
- Variação: ${context.recentTransactions.changePercent > 0 ? '+' : ''}${context.recentTransactions.changePercent.toFixed(1)}%

UTILIZAÇÃO DO ORÇAMENTO:
- Gasto no mês: R$ ${context.budgetUtilization.current.toFixed(2)}
- ${context.budgetUtilization.budget ? `Meta: R$ ${context.budgetUtilization.budget.toFixed(2)}` : `Limite: R$ ${context.budgetUtilization.limit.toFixed(2)}`}
- Utilização: ${context.budgetUtilization.utilizationPercent.toFixed(1)}%

SAÚDE FINANCEIRA: ${context.healthScore}/100

Se não houver gastos nos últimos 7 dias ou nada relevante a destacar, retorne should_display: false.`
      break
    }

    case 'post_transaction':
    {
      if (!transactionData) {
        return {
          message: '',
          tone: 'neutral',
          should_display: false,
          priority: 'low'
        } as AdvisorResponse
      }

      // Calculate if transaction is significant (>5% of budget or >R$100)
      const budgetBase = context.budgetUtilization.budget || context.budgetUtilization.limit
      const transactionPercent = budgetBase > 0 ? (transactionData.amount / budgetBase) * 100 : 0
      const isSignificant = transactionData.amount >= 100 || transactionPercent >= 5

      if (!isSignificant) {
        return {
          message: '',
          tone: 'neutral',
          should_display: false,
          priority: 'low'
        } as AdvisorResponse
      }

      const catVal = context.recentTransactions.last7Days.byCategory && context.recentTransactions.last7Days.byCategory[transactionData.categoryName]
      const catText = catVal ? `R$ ${catVal.toFixed(2)} nos últimos 7 dias` : 'Primeiro gasto nesta categoria recentemente'

      systemPrompt = baseSystem
      prompt = `O usuário acabou de registrar um gasto. Dê feedback imediato se relevante.

NOVO GASTO:
- Valor: R$ ${transactionData.amount.toFixed(2)}
- Descrição: ${transactionData.description}
- Categoria: ${transactionData.categoryName}
- Representa ${transactionPercent.toFixed(1)}% do orçamento/limite

CONTEXTO ATUAL:
- Total do mês: R$ ${context.budgetUtilization.current.toFixed(2)} → R$ ${(context.budgetUtilization.current + transactionData.amount).toFixed(2)}
- ${context.budgetUtilization.budget ? `Meta: R$ ${context.budgetUtilization.budget.toFixed(2)}` : `Limite: R$ ${context.budgetUtilization.limit.toFixed(2)}`}
- Nova utilização: ${((context.budgetUtilization.current + transactionData.amount) / budgetBase * 100).toFixed(1)}%
- Dias até fechar: ${context.invoiceTimeline.daysUntilClosing}

GASTOS RECENTES NA MESMA CATEGORIA:
${catText}

Se o gasto for normal/esperado sem nada especial a destacar, retorne should_display: false.
Destaque apenas se: estourou orçamento, categoria com muitos gastos, valor alto, ou padrão preocupante.`
      break
    }

    case 'pre_fechamento':
    {
      if (context.invoiceTimeline.daysUntilClosing > 5) {
        return {
          message: '',
          tone: 'neutral',
          should_display: false,
          priority: 'low'
        } as AdvisorResponse
      }

      const daysRemaining = context.invoiceTimeline.daysUntilClosing
      const budgetLeft = (context.budgetUtilization.budget || context.budgetUtilization.limit) - context.budgetUtilization.current
      const dailySafeAmount = budgetLeft > 0 ? budgetLeft / Math.max(1, daysRemaining) : 0

      systemPrompt = baseSystem
      prompt = `A fatura está prestes a fechar. Crie um plano de ação com valor diário seguro.

SITUAÇÃO DA FATURA:
- Dias até fechar: ${daysRemaining}
- Data de fechamento: ${context.invoiceTimeline.closingDate.toLocaleDateString('pt-BR')}

ORÇAMENTO:
- Gasto atual: R$ ${context.budgetUtilization.current.toFixed(2)}
- ${context.budgetUtilization.budget ? `Meta: R$ ${context.budgetUtilization.budget.toFixed(2)}` : `Limite: R$ ${context.budgetUtilization.limit.toFixed(2)}`}
- Utilização: ${context.budgetUtilization.utilizationPercent.toFixed(1)}%
- Saldo restante: R$ ${budgetLeft.toFixed(2)}
- Valor seguro por dia: R$ ${dailySafeAmount.toFixed(2)}

SAÚDE FINANCEIRA: ${context.healthScore}/100

Se já estourou o orçamento, foque em contenção. Se está confortável, parabenize brevemente.
Sempre inclua o valor diário seguro na mensagem.`
      break
    }

    case 'budget_review':
    {
      systemPrompt = baseSystem
      const bm = context.budgetMetrics

      if (!bm || (bm.totalMonthlyIncome === 0 && bm.overBudgetCategories.length === 0)) {
        return {
          message: 'Configure suas receitas e metas de categoria para receber recomendações personalizadas.',
          tone: 'neutral',
          should_display: true,
          priority: 'low'
        } as AdvisorResponse
      }

      const overBudgetText = bm.overBudgetCategories.length > 0
        ? bm.overBudgetCategories.map(c => `${c.name}: ${c.overagePercent}% acima`).join(', ')
        : 'Nenhuma categoria acima do limite'

      prompt = `Analise o orçamento mensal do usuário e sugira ajustes realistas nas metas de categoria.
Baseie-se nos padrões de gasto reais, não em valores arbitrários.
Explique o raciocínio por trás de cada sugestão.

ORÇAMENTO MENSAL:
- Receita total: R$ ${bm.totalMonthlyIncome.toFixed(2)}
- Taxa de poupança: ${bm.savingsRate}%
- Utilização geral: ${bm.budgetUtilizationOverall}%

CATEGORIAS ACIMA DO LIMITE:
${overBudgetText}

GASTOS RECENTES (últimos 7 dias):
- Total: R$ ${context.recentTransactions.last7Days.total.toFixed(2)}
- Por categoria: ${Object.entries(context.recentTransactions.last7Days.byCategory)
  .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
  .join(', ') || 'Nenhum gasto'}

SAÚDE FINANCEIRA: ${context.healthScore}/100

Dê 1-2 sugestões concretas de ajuste com valores específicos.
Se a taxa de poupança for baixa, sugira estratégias de alocação (reserva de emergência, quitação de dívidas).
Se tudo estiver bem, parabenize e sugira metas de economia.

IMPORTANTE: Esta é uma análise gerada por inteligência artificial.`
      break
    }

    default:
      return {
        message: '',
        tone: 'neutral',
        should_display: false,
        priority: 'low'
      } as AdvisorResponse
  }

  try {
    const { text } = await generateText({
      model: gateway('gpt-4o-mini'),
      system: systemPrompt,
      prompt,
      temperature: 0.6,
      maxTokens: 400,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'contextual-advisor',
        metadata: {
          userId,
          triggerType
        }
      }
    })

    const parsed = parseJsonWithSchema(text, advisorResponseSchema)
    const response = { ...parsed, action: parsed.action ?? undefined } satisfies AdvisorResponse

    // Validate response structure
    return {
      message: response.message || '',
      tone: response.tone || 'neutral',
      action: response.action ?? undefined,
      should_display: response.should_display ?? true,
      priority: response.priority || 'low'
    }
  } catch (error) {
    console.error('Contextual Advisor Error:', error)

    // Budget review gets a helpful fallback instead of empty response
    if (triggerType === 'budget_review') {
      return {
        message: 'Tente manter gastos abaixo de 80% do limite por categoria. Revise suas metas mensalmente para ajustes realistas.',
        tone: 'neutral',
        action: { type: 'suggestion', text: 'Revise suas categorias com maior gasto' },
        should_display: true,
        priority: 'low'
      } as AdvisorResponse
    }

    // Silent fail - advisor is non-critical
    return {
      message: '',
      tone: 'neutral',
      should_display: false,
      priority: 'low'
    } as AdvisorResponse
  }
})
