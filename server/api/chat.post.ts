import { streamText } from 'ai'
import { gateway } from '../utils/ai'
import prisma from '../utils/prisma'
import { enforceRateLimit } from '../utils/ai-rate-limit'
import { z } from 'zod'

const messageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId

  enforceTierAccess(await checkAndIncrementUsage(appUser.dbUserId, appUser.tier, 'ai_chat'))
  enforceRateLimit(`ai:chat:${userId}`, 20, 60 * 1000)

  const body = await readBody(event)
  const { messages } = messageSchema.parse(body)

  // Fetch user financial context for grounded responses
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [cards, installments, categories] = await Promise.all([
    prisma.creditCard.findMany({ where: { userId }, select: { name: true, limit: true, budget: true } }),
    prisma.installment.findMany({
      where: { dueDate: { gte: startDate, lte: endDate }, transaction: { userId } },
      include: { transaction: { include: { category: { select: { name: true } } } } },
    }),
    prisma.category.findMany({ where: { userId }, select: { name: true } }),
  ])

  const totalSpent = installments.reduce((sum, i) => sum + i.amount.toNumber(), 0)
  const categorySpending: Record<string, number> = {}
  for (const inst of installments) {
    const cat = inst.transaction.category.name
    categorySpending[cat] = (categorySpending[cat] ?? 0) + inst.amount.toNumber()
  }

  const systemPrompt = `Você é a Du, assistente financeira inteligente do app Du. Você ajuda brasileiros a entender e melhorar sua vida financeira.

CONTEXTO DO USUÁRIO (${month}/${year}):
- Total gasto este mês: R$ ${totalSpent.toFixed(2)}
- Cartões: ${cards.map(c => `${c.name} (limite R$ ${c.limit.toFixed(2)}, orçamento R$ ${c.budget?.toFixed(2) ?? 'N/A'})`).join(', ') || 'Nenhum'}
- Gastos por categoria: ${Object.entries(categorySpending).map(([k, v]) => `${k}: R$ ${v.toFixed(2)}`).join(', ') || 'Nenhum gasto'}
- Categorias: ${categories.map(c => c.name).join(', ') || 'Nenhuma'}

REGRAS:
- Responda sempre em português brasileiro, tom amigável e direto (estilo NuBank/Due)
- Valores monetários sempre em formato brasileiro (R$ X.XXX,XX)
- Seja concisa — respostas curtas e úteis
- Quando possível, dê insights acionáveis baseados nos dados reais do usuário
- Nunca invente dados — use apenas o contexto fornecido`

  const result = streamText({
    model: gateway('gpt-4o-mini'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
    maxTokens: 800,
  })

  return result.toDataStreamResponse()
})
