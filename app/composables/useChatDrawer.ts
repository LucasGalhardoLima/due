import { useState } from '#app'
import type { ParsedExpenseResult } from '~/types/chat'

interface ChatDrawerState {
  open: boolean
  prefilled: ParsedExpenseResult | null
}

const state = useState<ChatDrawerState>('chat-drawer', () => ({
  open: false,
  prefilled: null,
}))

export function useChatDrawer() {
  function openWithParsed(parsed: ParsedExpenseResult) {
    state.value.prefilled = parsed
    state.value.open = true
  }

  function openEmpty() {
    state.value.prefilled = null
    state.value.open = true
  }

  function close() {
    state.value.open = false
    state.value.prefilled = null
  }

  return {
    isOpen: computed(() => state.value.open),
    prefilled: computed(() => state.value.prefilled),
    openWithParsed,
    openEmpty,
    close,
  }
}
