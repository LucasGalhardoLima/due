import { describe, it, expect, beforeEach, vi } from 'vitest'

// Minimal Nuxt mock — useState must behave like a module-level reactive ref
vi.mock('#app', () => {
  const { ref } = require('vue')
  const store: Record<string, ReturnType<typeof ref>> = {}
  return {
    useState: (key: string, init: () => unknown) => {
      if (!store[key]) store[key] = ref(init())
      return store[key]
    },
  }
})

import { useTransactionFilter } from '../../app/composables/useTransactionFilter'

describe('useTransactionFilter', () => {
  // Clear shared useState between tests
  beforeEach(() => {
    useTransactionFilter().clearFilter()
  })

  it('starts with no active filter', () => {
    const { activeFilter } = useTransactionFilter()
    expect(activeFilter.value).toBeNull()
  })

  it('applies a filter event', () => {
    const { activeFilter, applyFilter } = useTransactionFilter()
    applyFilter({ type: 'filter:apply', filters: { merchant: 'Uber Eats' } })
    expect(activeFilter.value).toEqual({ merchant: 'Uber Eats' })
  })

  it('clears a filter', () => {
    const { activeFilter, applyFilter, clearFilter } = useTransactionFilter()
    applyFilter({ type: 'filter:apply', filters: { minAmount: 200 } })
    clearFilter()
    expect(activeFilter.value).toBeNull()
  })

  it('expands month shorthand to dateFrom/dateTo', () => {
    const { activeFilter, applyFilter } = useTransactionFilter()
    applyFilter({ type: 'filter:apply', filters: { month: '2025-03' } })
    expect(activeFilter.value?.dateFrom).toBe('2025-03-01')
    expect(activeFilter.value?.dateTo).toBe('2025-03-31')
    expect(activeFilter.value?.month).toBeUndefined()
  })

  it('matchesFilter returns true for matching merchant (case-insensitive)', () => {
    const { applyFilter, matchesFilter } = useTransactionFilter()
    applyFilter({ type: 'filter:apply', filters: { merchant: 'uber' } })
    expect(matchesFilter({ description: 'Uber Eats', amount: 50, purchaseDate: '2025-03-15', category: 'Alimentação' })).toBe(true)
  })

  it('matchesFilter returns false for amount below minAmount', () => {
    const { applyFilter, matchesFilter } = useTransactionFilter()
    applyFilter({ type: 'filter:apply', filters: { minAmount: 200 } })
    expect(matchesFilter({ description: 'Uber Eats', amount: 50, purchaseDate: '2025-03-15', category: 'Alimentação' })).toBe(false)
  })

  it('matchesFilter filters by category name (case-insensitive)', () => {
    const { applyFilter, matchesFilter } = useTransactionFilter()
    applyFilter({ type: 'filter:apply', filters: { category: 'saúde' } })
    expect(matchesFilter({ description: 'Farmácia', amount: 80, purchaseDate: '2025-03-10', category: 'Saúde' })).toBe(true)
    expect(matchesFilter({ description: 'Uber Eats', amount: 50, purchaseDate: '2025-03-15', category: 'Alimentação' })).toBe(false)
  })
})
