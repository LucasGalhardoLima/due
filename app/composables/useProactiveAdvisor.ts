import { useState } from '#app'

export interface AdvisorMessage {
  message: string
  tone: 'curious' | 'warning' | 'congratulatory' | 'neutral'
  action?: {
    type: 'suggestion' | 'alert'
    text: string
  }
  priority: 'low' | 'medium' | 'high'
  triggerType: 'morning_check' | 'post_transaction' | 'pre_fechamento'
  timestamp: number
}

interface AdvisorState {
  currentMessage: AdvisorMessage | null
  isLoading: boolean
  lastShownAt: number | null
  pendingRequest: Promise<void> | null
}

// Rate limiting cooldowns in milliseconds
const COOLDOWNS = {
  morning_check: 4 * 60 * 60 * 1000,     // 4 hours
  post_transaction: 30 * 60 * 1000,       // 30 min
  pre_fechamento: 24 * 60 * 60 * 1000     // 24 hours
} as const

// LocalStorage keys
const STORAGE_PREFIX = 'due:advisor:'
const getLastShownKey = (type: string) => `${STORAGE_PREFIX}lastShown:${type}`
const SESSION_KEY = `${STORAGE_PREFIX}sessionId`

function getStorageValue(key: string): number | null {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(key)
  return value ? parseInt(value, 10) : null
}

function setStorageValue(key: string, value: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, value.toString())
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

export function useProactiveAdvisor() {
  const state = useState<AdvisorState>('proactive-advisor', () => ({
    currentMessage: null,
    isLoading: false,
    lastShownAt: null,
    pendingRequest: null
  }))

  const hasMessage = computed(() => !!state.value.currentMessage)
  const isLoading = computed(() => state.value.isLoading)
  const currentMessage = computed(() => state.value.currentMessage)

  /**
   * Check if we should show a message for this trigger type
   * Based on rate limiting rules
   */
  function shouldShowForTrigger(type: keyof typeof COOLDOWNS): boolean {
    if (typeof window === 'undefined') return false

    const lastShown = getStorageValue(getLastShownKey(type))
    const cooldown = COOLDOWNS[type]
    const now = Date.now()

    // Special rule for morning_check: only once per session
    if (type === 'morning_check') {
      const currentSession = getSessionId()
      const lastSession = localStorage.getItem(`${STORAGE_PREFIX}lastSession:morning_check`)
      if (lastSession === currentSession) {
        return false
      }
    }

    // Check cooldown
    if (lastShown && (now - lastShown) < cooldown) {
      return false
    }

    return true
  }

  /**
   * Trigger the advisor with a specific type
   */
  async function trigger(
    type: keyof typeof COOLDOWNS,
    options?: {
      cardId?: string
      transactionData?: {
        amount: number
        description: string
        categoryName: string
      }
    }
  ): Promise<void> {
    // Don't trigger if already loading or pending request
    if (state.value.isLoading || state.value.pendingRequest) {
      return
    }

    // Check rate limiting (allow post_transaction to bypass if transactionData provided)
    if (type !== 'post_transaction' && !shouldShowForTrigger(type)) {
      return
    }

    state.value.isLoading = true

    const request = (async () => {
      try {
        const response = await $fetch<{
          message: string
          tone: 'curious' | 'warning' | 'congratulatory' | 'neutral'
          action?: { type: 'suggestion' | 'alert'; text: string }
          should_display: boolean
          priority: 'low' | 'medium' | 'high'
        }>('/api/advisor/contextual', {
          method: 'POST',
          body: {
            triggerType: type,
            cardId: options?.cardId,
            transactionData: options?.transactionData
          }
        })

        if (response.should_display && response.message) {
          const now = Date.now()

          state.value.currentMessage = {
            message: response.message,
            tone: response.tone,
            action: response.action,
            priority: response.priority,
            triggerType: type,
            timestamp: now
          }
          state.value.lastShownAt = now

          // Update rate limiting storage
          setStorageValue(getLastShownKey(type), now)

          // For morning_check, also track session
          if (type === 'morning_check') {
            localStorage.setItem(
              `${STORAGE_PREFIX}lastSession:morning_check`,
              getSessionId()
            )
          }
        }
      } catch (error) {
        // Silent fail - advisor is non-critical
        console.error('[ProactiveAdvisor] Error:', error)
      } finally {
        state.value.isLoading = false
        state.value.pendingRequest = null
      }
    })()

    state.value.pendingRequest = request
    await request
  }

  /**
   * Dismiss the current message
   */
  function dismiss(): void {
    state.value.currentMessage = null
  }

  /**
   * Reset rate limiting for testing
   */
  function resetRateLimits(): void {
    if (typeof window === 'undefined') return
    Object.keys(COOLDOWNS).forEach(type => {
      localStorage.removeItem(getLastShownKey(type))
    })
    localStorage.removeItem(`${STORAGE_PREFIX}lastSession:morning_check`)
    sessionStorage.removeItem(SESSION_KEY)
  }

  return {
    state: readonly(state),
    hasMessage,
    isLoading,
    currentMessage,
    trigger,
    dismiss,
    shouldShowForTrigger,
    resetRateLimits
  }
}
