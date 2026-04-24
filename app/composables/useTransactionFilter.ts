import { useState } from '#app'
import { computed } from 'vue'
import type { ChatFilterEvent, FilterParams } from '~/types/chat'

interface FilterState {
  active: FilterParams | null
}

export function useTransactionFilter() {
  const state = useState<FilterState>('du-filter', () => ({ active: null }))

  const activeFilter = computed(() => state.value.active)

  function applyFilter(event: ChatFilterEvent) {
    if (event.type === 'filter:clear') {
      state.value.active = null
      return
    }

    const f = { ...event.filters }

    // Expand month shorthand "YYYY-MM" → dateFrom/dateTo
    if (f.month) {
      const [year, month] = f.month.split('-').map(Number)
      const lastDay = new Date(year!, month!, 0).getDate()
      f.dateFrom = `${f.month}-01`
      f.dateTo = `${f.month}-${String(lastDay).padStart(2, '0')}`
      delete f.month
    }

    state.value.active = f
  }

  function clearFilter() {
    state.value.active = null
  }

  function matchesFilter(tx: { description: string; amount: number; purchaseDate: string; category?: string }): boolean {
    const f = state.value.active
    if (!f) return true

    if (f.merchant && !tx.description.toLowerCase().includes(f.merchant.toLowerCase())) return false
    if (f.category && !(tx.category ?? '').toLowerCase().includes(f.category.toLowerCase())) return false
    if (f.minAmount !== undefined && tx.amount < f.minAmount) return false
    if (f.maxAmount !== undefined && tx.amount > f.maxAmount) return false
    if (f.dateFrom && tx.purchaseDate < f.dateFrom) return false
    if (f.dateTo && tx.purchaseDate > f.dateTo) return false

    return true
  }

  return { activeFilter, applyFilter, clearFilter, matchesFilter }
}
