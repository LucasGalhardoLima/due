import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Category Budget API', async () => {
  await setup({ server: true })

  let testCategoryId: string

  beforeAll(async () => {
    // Get an existing category or create one
    const categories = await $fetch('/api/categories')
    if (categories.length > 0) {
      testCategoryId = categories[0].id
    } else {
      // Create a category for testing
      const cat = await $fetch('/api/categories', {
        method: 'POST',
        body: { name: 'Test Category' },
      })
      testCategoryId = cat.id
    }
  })

  describe('PUT /api/category-budgets/:categoryId', () => {
    it('should create a new budget (upsert)', async () => {
      const result = await $fetch(`/api/category-budgets/${testCategoryId}`, {
        method: 'PUT',
        body: { amount: 800 },
      })

      expect(result).toHaveProperty('id')
      expect(result.amount).toBe(800)
      expect(result.categoryId).toBe(testCategoryId)
    })

    it('should update an existing budget (upsert)', async () => {
      const result = await $fetch(`/api/category-budgets/${testCategoryId}`, {
        method: 'PUT',
        body: { amount: 1000 },
      })

      expect(result.amount).toBe(1000)
      expect(result.categoryId).toBe(testCategoryId)
    })

    it('should reject if category not owned by user', async () => {
      try {
        await $fetch('/api/category-budgets/non-existent-category-id', {
          method: 'PUT',
          body: { amount: 500 },
        })
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(404)
      }
    })
  })

  describe('GET /api/category-budgets', () => {
    it('should return all category budgets for user', async () => {
      const result = await $fetch('/api/category-budgets')

      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('amount')
        expect(result[0]).toHaveProperty('categoryId')
        expect(result[0]).toHaveProperty('category')
        expect(result[0].category).toHaveProperty('name')
      }
    })
  })

  describe('DELETE /api/category-budgets/:categoryId', () => {
    it('should delete the category budget', async () => {
      const result = await $fetch(`/api/category-budgets/${testCategoryId}`, {
        method: 'DELETE',
      })

      expect(result.success).toBe(true)
    })

    it('should reject if category not found', async () => {
      try {
        await $fetch('/api/category-budgets/non-existent-id', {
          method: 'DELETE',
        })
        expect.fail('Should have thrown')
      } catch (e: any) {
        expect(e.statusCode || e.status).toBe(404)
      }
    })
  })
})
