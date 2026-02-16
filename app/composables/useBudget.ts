interface IncomeEntry {
  id: string
  description: string
  amount: number
  isRecurring: boolean
  month: number
  year: number
  createdAt: string
}

interface CategoryBudgetStatus {
  categoryId: string
  categoryName: string
  categoryColor: string | null
  categoryEmoji: string | null
  budgetLimit: number | null
  actualSpending: number
  percentage: number
  status: 'under' | 'warning' | 'exceeded' | 'no-limit'
}

export interface BudgetSummary {
  month: number
  year: number
  totalIncome: number
  totalSpending: number
  remaining: number
  savingsRate: number
  incomes: IncomeEntry[]
  categories: CategoryBudgetStatus[]
}

export const useBudget = () => {
  const { dataVersion } = useDataVersion()
  const now = new Date()

  const budgetParams = ref({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  })

  const { data: summary, refresh: refreshBudget, status } = useFetch<BudgetSummary>(
    '/api/budget/summary',
    {
      query: computed(() => ({
        month: budgetParams.value.month,
        year: budgetParams.value.year,
      })),
      watch: [budgetParams, dataVersion],
    }
  )

  function prevMonth() {
    if (budgetParams.value.month === 1) {
      budgetParams.value = { month: 12, year: budgetParams.value.year - 1 }
    } else {
      budgetParams.value = { ...budgetParams.value, month: budgetParams.value.month - 1 }
    }
  }

  function nextMonth() {
    if (budgetParams.value.month === 12) {
      budgetParams.value = { month: 1, year: budgetParams.value.year + 1 }
    } else {
      budgetParams.value = { ...budgetParams.value, month: budgetParams.value.month + 1 }
    }
  }

  return {
    budgetParams,
    summary,
    refreshBudget,
    status,
    prevMonth,
    nextMonth,
  }
}
