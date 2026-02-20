import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Income API', async () => {
  await setup({ server: true })

  let createdIncomeId: string

  describe('POST /api/income', () => {
    it('should create income with valid data', async () => {
      const result = await $fetch('/api/income', {
        method: 'POST',
        body: {
          description: 'Salário',
          amount: 5500,
          isRecurring: true,
          month: 2,
          year: 2026,
        },
      })

      expect(result).toHaveProperty('id')
      expect(result.description).toBe('Salário')
      expect(result.amount).toBe(5500)
      expect(result.isRecurring).toBe(true)
      createdIncomeId = result.id
    })

    it('should reject invalid amount (<= 0)', async () => {
      try {
        await $fetch('/api/income', {
          method: 'POST',
          body: {
            description: 'Invalid',
            amount: -100,
            isRecurring: false,
            month: 2,
            year: 2026,
          },
        })
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(400)
      }
    })

    it('should reject missing description', async () => {
      try {
        await $fetch('/api/income', {
          method: 'POST',
          body: {
            amount: 1000,
            isRecurring: false,
            month: 2,
            year: 2026,
          },
        })
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(400)
      }
    })
  })

  describe('GET /api/income', () => {
    it('should return incomes for the given month', async () => {
      const result = await $fetch('/api/income?month=2&year=2026')

      expect(result).toHaveProperty('incomes')
      expect(result).toHaveProperty('totalIncome')
      expect(Array.isArray(result.incomes)).toBe(true)
      expect(result.totalIncome).toBeGreaterThanOrEqual(0)
    })
  })

  describe('PUT /api/income/:id', () => {
    it('should update an existing income', async () => {
      if (!createdIncomeId) return

      const result = await $fetch(`/api/income/${createdIncomeId}`, {
        method: 'PUT',
        body: { description: 'Salário atualizado', amount: 6000 },
      })

      expect(result.description).toBe('Salário atualizado')
      expect(result.amount).toBe(6000)
    })

    it('should return 404 for non-existent income', async () => {
      try {
        await $fetch('/api/income/non-existent-id', {
          method: 'PUT',
          body: { description: 'Nope' },
        })
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(404)
      }
    })
  })

  describe('DELETE /api/income/:id', () => {
    it('should delete an existing income', async () => {
      if (!createdIncomeId) return

      const result = await $fetch(`/api/income/${createdIncomeId}`, {
        method: 'DELETE',
      })

      expect(result.success).toBe(true)
    })

    it('should return 404 for non-existent income', async () => {
      try {
        await $fetch('/api/income/non-existent-id', {
          method: 'DELETE',
        })
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(404)
      }
    })
  })
})
