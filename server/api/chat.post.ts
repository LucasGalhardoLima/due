import { streamText, StreamData, generateObject } from 'ai'
import { gateway } from '../utils/ai'
import prisma from '../utils/prisma'
import { enforceRateLimit } from '../utils/ai-rate-limit'
import { detectChatIntent } from '../utils/chat-intent'
import { parseExpenseInline } from '../utils/parse-expense-inline'
import { z } from 'zod'

const filterSchema = z.object({
  merchant: z.string().optional().describe('Nome do estabelecimento/loja, em minúsculas'),
  category: z.string().optional().describe('Nome da categoria de gastos'),
  minAmount: z.number().optional().describe('Valor mínimo em reais'),
  maxAmount: z.number().optional().describe('Valor máximo em reais'),
  month: z.string().optional().describe('Mês no formato YYYY-MM, ex: 2025-03'),
  installmentOnly: z.boolean().optional().describe('Somente transações parceladas'),
})

async function extractFilterParams(message: string): Promise<z.infer<typeof filterSchema> | null> {
  try {
    const today = new Date()
    const { object } = await generateObject({
      model: gateway('gpt-4o-mini'),
      schema: filterSchema,
      prompt: `Hoje é ${today.toISOString().slice(0, 10)}. Extraia os parâmetros de filtro da seguinte mensagem do usuário em português brasileiro. Retorne apenas os campos relevantes presentes na mensagem.\n\nMensagem: "${message}"`,
    })
    const hasAnyParam = Object.values(object).some(v => v !== undefined)
    return hasAnyParam ? object : null
  } catch {
    return null
  }
}

const messageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  context: z.object({
    route: z.string().optional(),
    tabContext: z.string().optional(),
  }).optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId

  enforceTierAccess(await checkAndIncrementUsage(appUser.dbUserId, appUser.tier, 'ai_chat'))
  enforceRateLimit(`ai:chat:${userId}`, 20, 60 * 1000)

  const body = await readBody(event)
  const { messages, context } = messageSchema.parse(body)

  const lastMessage = messages.at(-1)?.content ?? ''
  const intent = detectChatIntent(lastMessage)

  const filterParams = intent.isFilterIntent
    ? await extractFilterParams(lastMessage)
    : null

  // Fetch user financial context
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [cards, installments, categories] = await Promise.all([
    prisma.creditCard.findMany({ where: { userId }, select: { id: true, name: true, limit: true, budget: true } }),
    prisma.installment.findMany({
      where: { dueDate: { gte: startDate, lte: endDate }, transaction: { userId } },
      include: { transaction: { include: { category: { select: { name: true } } } } },
    }),
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true } }),
  ])

  const totalSpent = installments.reduce((sum, i) => sum + i.amount.toNumber(), 0)
  const categorySpending: Record<string, number> = {}
  for (const inst of installments) {
    const cat = inst.transaction.category.name
    categorySpending[cat] = (categorySpending[cat] ?? 0) + inst.amount.toNumber()
  }

  const contextNote = context?.tabContext
    ? `\nContexto atual do usuário: ${context.tabContext}`
    : ''

  const systemPrompt = `Você é a Du, assistente financeira inteligente do app Du. Você ajuda brasileiros a entender e melhorar sua vida financeira.

CONTEXTO DO USUÁRIO (${month}/${year}):${contextNote}
- Total gasto este mês: R$ ${totalSpent.toFixed(2)}
- Cartões: ${cards.map(c => `${c.name} (limite R$ ${c.limit.toFixed(2)}, orçamento R$ ${c.budget?.toFixed(2) ?? 'N/A'})`).join(', ') || 'Nenhum'}
- Gastos por categoria: ${Object.entries(categorySpending).map(([k, v]) => `${k}: R$ ${v.toFixed(2)}`).join(', ') || 'Nenhum gasto'}
- Categorias: ${categories.map(c => c.name).join(', ') || 'Nenhuma'}

REGRAS:
- Responda sempre em português brasileiro, tom amigável e direto (estilo NuBank/Du)
- Valores monetários sempre em formato brasileiro (R$ X.XXX,XX)
- Seja concisa — respostas curtas e úteis
- Quando possível, dê insights acionáveis baseados nos dados reais do usuário
- Nunca invente dados — use apenas o contexto fornecido`

  const data = new StreamData()

  // Emit metadata before streaming begins
  if (intent.isLongRunning) {
    data.append({ longRunning: true })
  }

  if (intent.isExpenseAdd) {
    const parsed = await parseExpenseInline(lastMessage, cards, categories)
    if (parsed) {
      data.append({ parsedExpense: parsed })
    }
  }

  if (filterParams) {
    data.append({ filterEvent: { type: 'filter:apply' as const, filters: filterParams } })
  }

  const result = streamText({
    model: gateway('gpt-4o-mini'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
    maxTokens: 800,
    onFinish: () => {
      data.close()
    },
    onError: () => {
      data.close()
    },
  })

  return result.toDataStreamResponse({ data })
})
