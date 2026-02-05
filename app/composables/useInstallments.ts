export const useInstallments = () => {
  // Timeline Data
  // We use a reactive query parameter for months to allow filtering if needed later
  const timelineParams = ref({
    months: 12,
    cardId: undefined as string | undefined
  })

  const { data: timeline, refresh: refreshTimeline, status: timelineStatus, error: timelineError } = 
    useFetch('/api/installments/timeline', {
      query: timelineParams,
      watch: [timelineParams]
    })

  // Health Data
  const { data: health, refresh: refreshHealth, status: healthStatus, error: healthError } = 
    useFetch('/api/installments/health', {
      query: computed(() => ({ cardId: timelineParams.value.cardId })),
      watch: [timelineParams]
    })

  // Simulation State - shared across components
  type SimulationResult = Record<string, unknown>
  const simulationState = useState<{ result: SimulationResult | null; isLoading: boolean }>(
    'installment-simulation',
    () => ({
      result: null,
      isLoading: false
    })
  )

  const simulate = async (amount: number, installments: number, cardId?: string) => {
    simulationState.value.isLoading = true
    try {
      const result = await $fetch('/api/installments/simulate', {
        method: 'POST',
        body: { amount, installments, cardId }
      })
      simulationState.value.result = result
    } catch (e) {
      console.error('Simulation failed', e)
    } finally {
      simulationState.value.isLoading = false
    }
  }

  const clearSimulation = () => {
    simulationState.value.result = null
  }

  // Optimizer State
  type OptimizationResult = Record<string, unknown>
  const optimizerState = useState<{ result: OptimizationResult | null; isLoading: boolean }>(
    'installment-optimizer',
    () => ({
      result: null,
      isLoading: false
    })
  )

  const optimize = async (cardId?: string) => {
    optimizerState.value.isLoading = true
    try {
      const result = await $fetch('/api/installments/optimize', {
        method: 'POST',
        body: { cardId }
      })
      optimizerState.value.result = result
    } catch (e) {
      console.error('Optimization failed', e)
    } finally {
      optimizerState.value.isLoading = false
    }
  }

  const clearOptimization = () => {
    optimizerState.value.result = null
  }

  // Helpers to update filters
  const setCardFilter = (cardId?: string) => {
    timelineParams.value.cardId = cardId
  }

  return {
    timeline,
    health,
    timelineStatus,
    healthStatus,
    timelineError,
    healthError,
    refreshTimeline,
    refreshHealth,
    simulationState,
    optimizerState,
    simulate,
    clearSimulation,
    optimize,
    clearOptimization,
    setCardFilter,
    filters: timelineParams
  }
}
