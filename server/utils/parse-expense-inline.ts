// server/utils/parse-expense-inline.ts
import { generateObject } from 'ai'
import { gateway } from './ai'
import { z } from 'zod'
import type { ParsedExpenseResult } from '~/types/chat'

const expenseSchema = z.object({
  description: z.string().describe('Short expense description in Portuguese'),
  amount: z.number().positive().describe('Expense amount in BRL, positive number'),
  date: z.string().describe('Purchase date in ISO 8601 format YYYY-MM-DD'),
  installments: z.number().int().min(1).default(1).describe('Number of installments, 1 for cash'),
  cardId: z.string().nullable().describe('Matching card ID from the provided list, or null if none matches'),
  categoryId: z.string().nullable().describe('Matching category ID from the provided list, or null if none matches'),
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
Cartões disponíveis:
${cards.map(c => `- ${c.name} (ID: ${c.id})`).join('\n') || '- nenhum'}
Categorias disponíveis:
${categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n') || '- nenhuma'}
Use null para cardId/categoryId se não encontrar correspondência exata.
Despesa: ${JSON.stringify(text)}`,
    })
    // Sanitize "null" strings to actual null
    return {
      ...object,
      cardId: object.cardId === 'null' ? null : object.cardId,
      categoryId: object.categoryId === 'null' ? null : object.categoryId,
    }
  } catch (err) {
    console.error('[parseExpenseInline] failed:', err)
    return null
  }
}
