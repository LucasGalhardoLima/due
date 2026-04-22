// server/utils/parse-expense-inline.ts
import { generateObject } from 'ai'
import { gateway } from './ai'
import { z } from 'zod'
import type { ParsedExpenseResult } from '~/types/chat'

const expenseSchema = z.object({
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  installments: z.number().int().min(1).default(1),
  cardId: z.string().nullable(),
  categoryId: z.string().nullable(),
})

export async function parseExpenseInline(
  text: string,
  cards: Array<{ id: string; name: string }>,
  categories: Array<{ id: string; name: string }>
): Promise<ParsedExpenseResult | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { object } = await generateObject({
      model: gateway('gpt-4o-mini'),
      schema: expenseSchema,
      prompt: `Extraia os dados da seguinte despesa em português brasileiro.
Data de hoje: ${today}
Cartões disponíveis: ${cards.map(c => `${c.id}:${c.name}`).join(', ') || 'nenhum'}
Categorias disponíveis: ${categories.map(c => `${c.id}:${c.name}`).join(', ') || 'nenhuma'}
Use null para cardId/categoryId se não encontrar correspondência.
Despesa: "${text}"`,
    })
    // Sanitize "null" strings to actual null
    return {
      ...object,
      cardId: object.cardId === 'null' ? null : object.cardId,
      categoryId: object.categoryId === 'null' ? null : object.categoryId,
    }
  } catch {
    return null
  }
}
