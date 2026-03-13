import { generateObject } from 'ai'
import { z } from 'zod'
import type { ParsedTransaction, CleanedTransaction } from './types'

interface CategoryOption {
  id: string
  name: string
}

interface CleanupOptions {
  skipAI?: boolean
}

const cleanupSchema = z.object({
  results: z.array(z.object({
    index: z.number(),
    cleanDescription: z.string(),
    suggestedCategory: z.string().nullable(),
  }))
})

export function buildCleanupPrompt(
  transactions: ParsedTransaction[],
  categories: CategoryOption[],
): string {
  const categoryNames = categories.map(c => c.name).join(', ')

  const lines = transactions.map((t, i) =>
    `${i}. "${t.rawDescription}" | Banco: ${t.bankCategory || 'N/A'} | Cidade: ${t.city || 'N/A'} | R$ ${t.amount.toFixed(2)}`
  ).join('\n')

  return `
Você é um assistente financeiro. Limpe as descrições de transações de cartão de crédito de faturas bancárias brasileiras.

Para cada transação:
1. Transforme a descrição críptica em um nome legível (ex: "RAIA182 -CT" → "Droga Raia", "MC DONALD S -CT" → "McDonald's")
2. Sugira a melhor categoria da lista disponível, ou null se nenhuma se encaixa

CATEGORIAS DISPONÍVEIS: ${categoryNames}

TRANSAÇÕES:
${lines}

Retorne APENAS o JSON com os resultados. O campo "suggestedCategory" deve ser o NOME EXATO de uma das categorias listadas, ou null.
`
}

export async function cleanupDescriptions(
  transactions: ParsedTransaction[],
  categories: CategoryOption[],
  options: CleanupOptions = {},
): Promise<CleanedTransaction[]> {
  const fallback = (): CleanedTransaction[] =>
    transactions.map(t => ({
      ...t,
      cleanDescription: t.rawDescription,
      suggestedCategory: matchCategoryByName(t.bankCategory, categories),
      suggestedCategoryId: matchCategoryIdByName(t.bankCategory, categories),
    }))

  if (options.skipAI) {
    return fallback()
  }

  try {
    const { gateway } = await import('../ai')

    const prompt = buildCleanupPrompt(transactions, categories)

    const { object } = await generateObject({
      model: gateway('gpt-4o-mini'),
      schema: cleanupSchema,
      prompt,
    })

    return transactions.map((t, i) => {
      const aiResult = object.results.find(r => r.index === i)
      const suggestedCatName = aiResult?.suggestedCategory || matchCategoryByName(t.bankCategory, categories)
      const suggestedCatId = suggestedCatName
        ? categories.find(c => c.name.toLowerCase() === suggestedCatName.toLowerCase())?.id || null
        : null

      return {
        ...t,
        cleanDescription: aiResult?.cleanDescription || t.rawDescription,
        suggestedCategory: suggestedCatName,
        suggestedCategoryId: suggestedCatId,
      }
    })
  } catch (err) {
    console.error('AI cleanup failed, falling back to raw descriptions:', err)
    return fallback()
  }
}

function matchCategoryByName(bankCategory: string, categories: CategoryOption[]): string | null {
  if (!bankCategory) return null
  const normalized = bankCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const match = categories.find(c => {
    const catNorm = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return catNorm === normalized || normalized.startsWith(catNorm) || catNorm.startsWith(normalized)
  })
  return match?.name || null
}

function matchCategoryIdByName(bankCategory: string, categories: CategoryOption[]): string | null {
  const name = matchCategoryByName(bankCategory, categories)
  if (!name) return null
  return categories.find(c => c.name === name)?.id || null
}
