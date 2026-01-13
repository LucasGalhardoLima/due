import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Dashboard API', async () => {
  await setup({
    server: true,
  })

  describe('GET /api/dashboard/current-invoice', () => {
    it('should return total amount for current open invoice', async () => {
      const result = await $fetch('/api/dashboard/current-invoice')
      
      expect(result).toHaveProperty('total')
      expect(typeof result.total).toBe('number')
      expect(result).toHaveProperty('month')
      expect(result).toHaveProperty('year')
    })
  })

  describe('GET /api/dashboard/future-projection', () => {
    it('should return projection for next 3 months', async () => {
      const result = await $fetch('/api/dashboard/future-projection')
      
      expect(result).toHaveProperty('projections')
      expect(result.projections).toHaveLength(3)
      
      result.projections.forEach((p: any) => {
        expect(p).toHaveProperty('month')
        expect(p).toHaveProperty('year')
        expect(p).toHaveProperty('total')
        expect(typeof p.total).toBe('number')
      })
    })
  })

  describe('GET /api/dashboard/pareto', () => {
    it('should return categories sorted by total spending', async () => {
      const result = await $fetch('/api/dashboard/pareto')
      
      expect(result).toHaveProperty('categories')
      expect(Array.isArray(result.categories)).toBe(true)
      
      if (result.categories.length > 0) {
        result.categories.forEach((c: any) => {
          expect(c).toHaveProperty('name')
          expect(c).toHaveProperty('total')
          expect(c).toHaveProperty('percentage')
        })
        
        // Should be sorted descending by total
        for (let i = 1; i < result.categories.length; i++) {
          expect(result.categories[i-1].total).toBeGreaterThanOrEqual(result.categories[i].total)
        }
      }
    })
  })
})
