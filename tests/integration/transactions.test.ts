import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Transaction API', async () => {
  await setup({
    server: true,
  })

  let testCardId: string
  let testCategoryId: string

  beforeAll(async () => {
    // Always create a fresh test card to ensure we have a valid UUID
    const card = await $fetch('/api/cards', {
      method: 'POST',
      body: {
        name: 'Test Card',
        limit: 10000,
        closingDay: 10,
        dueDay: 17,
      }
    })
    testCardId = card.id
    console.log('Created test card with ID:', testCardId)

    // Get or let backend create default category
    // The backend will create 'Outros' if categoryId is not provided
    const categories = await $fetch('/api/categories')
    if (categories.length > 0) {
      testCategoryId = categories[0].id
    }
    // If no categories exist, we'll omit categoryId and let the backend create 'Outros'
  })

  describe('POST /api/transactions', () => {
    it('should create a transaction with installments', async () => {
      const body: any = {
        description: 'Test Expense',
        amount: 1200,
        purchaseDate: new Date().toISOString(),
        installmentsCount: 12,
        cardId: testCardId,
      }
      
      // Only include categoryId if we have one, otherwise let backend create 'Outros'
      if (testCategoryId) {
        body.categoryId = testCategoryId
      }
      
      try {
        const result = await $fetch('/api/transactions', {
          method: 'POST',
          body
        })

        expect(result).toHaveProperty('id')
        expect(result.description).toBe('Test Expense')
        expect(result.amount).toBe(1200)
        expect(result.installmentsCount).toBe(12)
        expect(result.installments).toHaveLength(12)
        
        // Each installment should be 100
        result.installments.forEach((inst: any) => {
          expect(inst.amount).toBe(100)
        })
      } catch (error: any) {
        console.error('Test failed with error:', error)
        console.error('Request body was:', JSON.stringify(body, null, 2))
        console.error('Error data:', error.data)
        throw error
      }
    })

    it('should return 400 for invalid input', async () => {
      try {
        await $fetch('/api/transactions', {
          method: 'POST',
          body: {
            description: '',
            amount: -100,
          }
        })
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.statusCode).toBe(400)
      }
    })

    it('should return 404 for non-existent card', async () => {
      try {
        await $fetch('/api/transactions', {
          method: 'POST',
          body: {
            description: 'Test',
            amount: 100,
            purchaseDate: new Date().toISOString(),
            installmentsCount: 1,
            cardId: '00000000-0000-0000-0000-000000000000',
          }
        })
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.statusCode).toBe(404)
      }
    })
  })
})
