import { z } from 'zod'
import { generateObject } from 'ai'
import prisma from '../../utils/prisma'
import { gateway } from '../../utils/ai'
import { enforceRateLimit } from '../../utils/ai-rate-limit'

const bodySchema = z.object({
  description: z.string().min(1),
  amount: z.number().optional(),
  cardId: z.string().uuid().optional()
})

export default defineEventHandler(async (event) => {
  const { userId } = getUser(event)
  enforceRateLimit(`ai:category-suggest:${userId}`, 30, 10 * 60 * 1000)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid body' })
  }

  const { description, amount, cardId } = parsed.data

  const [categories, similar] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true }
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        description: {
          contains: description,
          mode: 'insensitive'
        },
        ...(cardId ? { cardId } : {})
      },
      select: {
        description: true,
        category: { select: { name: true } }
      },
      orderBy: { purchaseDate: 'desc' },
      take: 6
    })
  ])

  const categoriesContext = categories.map((c) => `- ${c.name} (ID: ${c.id})`).join('\n')
  const similarContext = similar.length
    ? similar.map((t) => `- "${t.description}" => ${t.category.name}`).join('\n')
    : 'Nenhuma compra semelhante encontrada.'

  const prompt = `
Você é um assistente financeiro. Sugira a categoria mais provável para uma despesa com base na descrição e no histórico.

DESCRIÇÃO: "${description}"
VALOR: ${amount ?? 'N/A'}

CATEGORIAS EXISTENTES:
${categoriesContext || 'Nenhuma categoria cadastrada.'}

COMPRAS SEMELHANTES:
${similarContext}

REGRAS:
1. Se uma categoria existente fizer sentido, retorne o ID dessa categoria.
2. Se nenhuma categoria existente se encaixar, sugira um NOVO nome curto de categoria (ex: "Pets", "Academia", "Presentes").
3. Responda APENAS o JSON.
`

  const { object } = await generateObject({
    model: gateway('gpt-4o-mini'),
    schema: z.object({
      categoryId: z.string().nullable(),
      categoryName: z.string().min(1)
    }),
    prompt
  })

  let finalCategoryId = object.categoryId
  let finalCategoryName = object.categoryName.trim()
  let created = false

  if (finalCategoryId) {
    const existingById = await prisma.category.findFirst({
      where: { id: finalCategoryId, userId }
    })
    if (!existingById) {
      finalCategoryId = null
    } else {
      finalCategoryName = existingById.name
    }
  }

  if (!finalCategoryId) {
    const existingByName = await prisma.category.findFirst({
      where: {
        userId,
        name: {
          equals: finalCategoryName,
          mode: 'insensitive'
        }
      }
    })

    if (existingByName) {
      finalCategoryId = existingByName.id
      finalCategoryName = existingByName.name
    } else {
      const createdCategory = await prisma.category.create({
        data: {
          name: finalCategoryName,
          userId
        }
      })
      finalCategoryId = createdCategory.id
      finalCategoryName = createdCategory.name
      created = true
    }
  }

  return {
    categoryId: finalCategoryId,
    categoryName: finalCategoryName,
    created
  }
})
