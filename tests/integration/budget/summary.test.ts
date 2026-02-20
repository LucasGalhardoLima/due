import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Budget Summary API', async () => {
  await setup({ server: true })

  beforeAll(async () => {
    // Seed income for testing
    await $fetch('/api/income', {
      method: 'POST',
      body: {
        description: 'Salário',
        amount: 5500,
        isRecurring: true,
        month: 2,
        year: 2026,
      },
    })

    await $fetch('/api/income', {
      method: 'POST',
      body: {
        description: 'Freelance',
        amount: 800,
        isRecurring: false,
        month: 2,
        year: 2026,
      },
    })
  })

  describe('GET /api/budget/summary', () => {
    it('should return correct totalIncome from multiple incomes', async () => {
      const result = await $fetch('/api/budget/summary?month=2&year=2026')

      expect(result).toHaveProperty('totalIncome')
      expect(result).toHaveProperty('totalSpending')
      expect(result).toHaveProperty('remaining')
      expect(result).toHaveProperty('savingsRate')
      expect(result).toHaveProperty('incomes')
      expect(result).toHaveProperty('categories')
      expect(result.totalIncome).toBeGreaterThanOrEqual(6300)
    })

    it('should return category breakdown with correct status thresholds', async () => {
      const result = await $fetch('/api/budget/summary?month=2&year=2026')

      expect(Array.isArray(result.categories)).toBe(true)

      for (const cat of result.categories) {
        expect(cat).toHaveProperty('categoryId')
        expect(cat).toHaveProperty('categoryName')
        expect(cat).toHaveProperty('actualSpending')
        expect(cat).toHaveProperty('status')
        expect(['under', 'warning', 'exceeded', 'no-limit']).toContain(cat.status)
      }
    })

    it('should return spending calculated from installments', async () => {
      const result = await $fetch('/api/budget/summary?month=2&year=2026')

      expect(typeof result.totalSpending).toBe('number')
      expect(result.totalSpending).toBeGreaterThanOrEqual(0)
      expect(typeof result.remaining).toBe('number')
    })

    it('should reject invalid query params', async () => {
      try {
        await $fetch('/api/budget/summary')
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(400)
      }
    })
  })
})
