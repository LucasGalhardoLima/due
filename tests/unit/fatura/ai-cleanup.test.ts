import { describe, it, expect, vi } from 'vitest'
import { cleanupDescriptions, buildCleanupPrompt } from '../../../server/utils/fatura/ai-cleanup'
import type { ParsedTransaction } from '../../../server/utils/fatura/types'

describe('buildCleanupPrompt', () => {
  it('should build a prompt with all raw descriptions', () => {
    const transactions: ParsedTransaction[] = [
      { purchaseDate: '2025-12-13', rawDescription: 'RAIA182 -CT', amount: 77.65, installmentsCount: 1, bankCategory: 'SAÚDE', city: 'MATAO' },
      { purchaseDate: '2025-12-13', rawDescription: 'MC DONALD S -CT', amount: 132.80, installmentsCount: 1, bankCategory: 'ALIMENTAÇÃO', city: 'MATAO' },
    ]
    const categories = [{ id: '1', name: 'Saúde' }, { id: '2', name: 'Alimentação' }]

    const prompt = buildCleanupPrompt(transactions, categories)

    expect(prompt).toContain('RAIA182 -CT')
    expect(prompt).toContain('MC DONALD S -CT')
    expect(prompt).toContain('SAÚDE')
    expect(prompt).toContain('Saúde')
    expect(prompt).toContain('Alimentação')
  })
})

describe('cleanupDescriptions', () => {
  it('should fall back to raw descriptions when AI fails', async () => {
    const transactions: ParsedTransaction[] = [
      { purchaseDate: '2025-12-13', rawDescription: 'RAIA182 -CT', amount: 77.65, installmentsCount: 1, bankCategory: 'SAÚDE', city: 'MATAO' },
    ]
    const categories = [{ id: '1', name: 'Saúde' }]

    // skipAI flag triggers fallback
    const result = await cleanupDescriptions(transactions, categories, { skipAI: true })

    expect(result).toHaveLength(1)
    expect(result[0]!.cleanDescription).toBe('RAIA182 -CT') // Falls back to raw
    expect(result[0]!.suggestedCategory).toBe('Saúde') // Matched by bank category name
    expect(result[0]!.suggestedCategoryId).toBe('1')
  })
})
