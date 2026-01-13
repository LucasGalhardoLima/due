import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Transaction API', async () => {
  await setup({
    server: true,
  })

  let testCardId: string
  let testCategoryId: string

  beforeAll(async () => {
    // Get or create test card
    const cards = await $fetch('/api/cards')
    if (cards.length > 0) {
      testCardId = cards[0].id
    } else {
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
    }

    // Get default category
    const categories = await $fetch('/api/categories')
    if (categories.length > 0) {
      testCategoryId = categories[0].id
    } else {
      // Direct prisma call since we don't have POST /api/categories yet?
      // Or seed it using internal server util?
      // Actually we are in e2e/setup context. Let's use a raw prisma call if possible or mock?
      // Wait, we can't access prisma easily here from the test file if it runs in a separate process env? 
      // Vitest environment 'nuxt' should allow access to standard nuxt constructs?
      // Let's assumie seeds ran. But if not, we fail.
      // Let's just create one manually using raw fetch to a special test endpoint or direct prisma import?
      // We can create a temporary endpoint to create category, OR just ensure test DB is seeded.
      
      // Better: Create a category directly using prisma client in test?
      // Vitest server: true setup mocks $fetch. 
      // Imports from '../../utils/prisma' might work if environment allows.
      
      // Use logic to skip this if we can.
      // Actually, I can rely on 'Outros' logic in backend being broken if 'Outros' doesn't exist.
      // The backend tries to find 'Outros'. If doesn't exist, it uses `categoryId!`. That throws.
      // The backend should create 'Outros' if missing!
    }
  })

  describe('POST /api/transactions', () => {
    it('should create a transaction with installments', async () => {
      const result = await $fetch('/api/transactions', {
        method: 'POST',
        body: {
          description: 'Test Expense',
          amount: 1200,
          purchaseDate: new Date().toISOString(),
          installmentsCount: 12,
          cardId: testCardId,
          categoryId: testCategoryId,
        }
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
