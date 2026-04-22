import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('#app', () => {
  const { reactive } = require('vue')
  const store: Record<string, any> = {}
  const mockRoute = reactive({ path: '/dashboard', query: { tab: 'cartao' } })
  return {
    useState: (key: string, init: () => unknown) => {
      const { ref } = require('vue')
      if (!store[key]) store[key] = ref(init())
      return store[key]
    },
    useRoute: () => mockRoute,
    _setMockRoute: (route: any) => {
      Object.assign(mockRoute, route)
    },
  }
})

import { useChatContext } from '../../app/composables/useChatContext'
import { _setMockRoute } from '#app'

describe('useChatContext', () => {
  it('returns credit card suggestions on /dashboard with cartao tab', () => {
    _setMockRoute({ path: '/dashboard', query: { tab: 'cartao' } })
    const { suggestions, greeting } = useChatContext()
    expect(suggestions.value).toHaveLength(5)
    expect(suggestions.value[0].message).toContain('adicionar')
    expect(greeting.value).toContain('Cartão')
  })

  it('returns cash flow suggestions on /dashboard with fluxo tab', () => {
    _setMockRoute({ path: '/dashboard', query: { tab: 'fluxo' } })
    const { suggestions } = useChatContext()
    expect(suggestions.value.some(s => s.message.includes('orçamento'))).toBe(true)
  })

  it('returns installment suggestions on /parcelamentos', () => {
    _setMockRoute({ path: '/parcelamentos', query: {} })
    const { suggestions } = useChatContext()
    expect(suggestions.value.some(s => s.message.includes('parcelamento'))).toBe(true)
  })

  it('always returns exactly 5 suggestions', () => {
    _setMockRoute({ path: '/unknown-page', query: {} })
    const { suggestions } = useChatContext()
    expect(suggestions.value).toHaveLength(5)
  })
})
