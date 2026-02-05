import { generateObject } from 'ai'
import { z } from 'zod'
import { gateway } from '../../utils/ai'
import prisma from '../../utils/prisma'
import { enforceRateLimit } from '../../utils/ai-rate-limit'

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  enforceRateLimit(`ai:parse-expense:${userId}`, 30, 10 * 60 * 1000)
  const body = await readBody(event)
  const { text, currentDate } = body

  if (!text) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Texto é obrigatório'
    })
  }

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

  // Context strings
  const cardsContext = cards.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')
  const categoriesContext = categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n')

  const prompt = `
    Você é um assistente financeiro inteligente. Sua tarefa é analisar um texto em linguagem natural sobre uma despesa e extrair os dados estruturados.

    DATA ATUAL: ${currentDate || new Date().toISOString()}

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

    return object
  } catch (error) {
    console.error('AI Parse Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar com IA'
    })
  }
})
