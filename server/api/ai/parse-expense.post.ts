import { generateObject } from 'ai'
import { z } from 'zod'
import { gateway } from '../../utils/ai'
import prisma from '../../utils/prisma'
import { enforceRateLimit } from '../../utils/ai-rate-limit'
import { sanitizePromptInput } from '../../utils/ai-guard'

const bodySchema = z.object({
  text: z.string().min(1).max(500),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/).optional()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  enforceRateLimit(`ai:parse-expense:${userId}`, 30, 10 * 60 * 1000)

  const rawBody = await readBody(event)
  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const text = sanitizePromptInput(parsed.data.text)
  const currentDate = parsed.data.currentDate
    ? sanitizePromptInput(parsed.data.currentDate)
    : new Date().toISOString()

  // Fetch context
  const [cards, categories] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId },
      select: { id: true, name: true }
    }),
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true }
    })
  ])

  const validCardIds = new Set(cards.map(c => c.id))
  const validCategoryIds = new Set(categories.map(c => c.id))

  // Context strings
  const cardsContext = cards.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')
  const categoriesContext = categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')

  const prompt = `
    Você é um assistente financeiro inteligente. Sua tarefa é analisar um texto em linguagem natural sobre uma despesa e extrair os dados estruturados.

    DATA ATUAL: ${currentDate}

    TEXTO DO USUÁRIO: "${text}"

    CONTEXTO DE CARTÕES:
    ${cardsContext}

    CONTEXTO DE CATEGORIAS:
    ${categoriesContext}

    INSTRUÇÕES:
    1. Extraia a descrição da compra. Seja conciso.
    2. Extraia o valor total.
    3. Determine a data da compra. Se o usuário disser "hoje", "ontem", "anteontem", use a DATA ATUAL como referência. Se não mencionar, assuma HOJE.
    4. Extraia o número de parcelas. Se não mencionado, assuma 1.
    5. Tente identificar o cartão mais provável baseado no nome. Se não encontrar correspondência clara, deixe null.
    6. Tente identificar a categoria mais provável. Se não encontrar, deixe null.

    Retorne APENAS o JSON.
  `

  try {
    const { object } = await generateObject({
      model: gateway('gpt-4o-mini'),
      schema: z.object({
        description: z.string(),
        amount: z.number(),
        date: z.string().describe('ISO 8601 format YYYY-MM-DD'),
        installments: z.number().default(1),
        cardId: z.string().nullable().describe('The ID of the matched card or null'),
        categoryId: z.string().nullable().describe('The ID of the matched category or null')
      }),
      prompt: prompt
    })

    // Sanitize: AI sometimes returns "null" string instead of actual null
    if (object.cardId === 'null') object.cardId = null
    if (object.categoryId === 'null') object.categoryId = null

    // Re-verify AI-returned IDs belong to this user — never trust LLM output as authoritative
    if (object.cardId && !validCardIds.has(object.cardId)) object.cardId = null
    if (object.categoryId && !validCategoryIds.has(object.categoryId)) object.categoryId = null

    return object
  } catch (error) {
    console.error('AI Parse Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar com IA'
    })
  }
})
