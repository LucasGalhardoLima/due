import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('Subscription Report API', async () => {
  await setup({ server: true })

  describe('GET /api/reports/subscriptions', () => {
    it('should return 401 without a valid session token', async () => {
      try {
        await $fetch('/api/reports/subscriptions', {
          headers: {
            Authorization: '',
          },
          credentials: 'omit',
        })
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.statusCode ?? error.status).toBe(401)
      }
    })
  })
})
