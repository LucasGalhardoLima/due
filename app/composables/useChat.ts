import { useState, useRoute } from '#app'
import { computed } from 'vue'
import type { ChatMessage, ChatStreamMetadata, ParsedExpenseResult } from '~/types/chat'

interface ChatState {
  isOpen: boolean
  thread: ChatMessage[]
  isStreaming: boolean
  pendingInput: string
  isLongRunning: boolean
  pendingExpense: ParsedExpenseResult | null
}

function nanoid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function parseAIDataStream(line: string): { text?: string; data?: ChatStreamMetadata } | null {
  if (line.startsWith('0:')) {
    try { return { text: JSON.parse(line.slice(2)) } } catch { return null }
  }
  if (line.startsWith('2:')) {
    try {
      const arr = JSON.parse(line.slice(2)) as ChatStreamMetadata[]
      return { data: arr[0] }
    } catch { return null }
  }
  return null
}

export function useChat() {
  const state = useState<ChatState>('du-chat', () => ({
    isOpen: false,
    thread: [],
    isStreaming: false,
    pendingInput: '',
    isLongRunning: false,
    pendingExpense: null,
  }))

  const isOpen = computed(() => state.value.isOpen)
  const thread = computed(() => state.value.thread)
  const isStreaming = computed(() => state.value.isStreaming)
  const pendingInput = computed(() => state.value.pendingInput)
  const isLongRunning = computed(() => state.value.isLongRunning)
  const pendingExpense = computed(() => state.value.pendingExpense)

  const route = useRoute()

  function open(options?: { preloadedMessage?: string }) {
    state.value.isOpen = true
    if (options?.preloadedMessage) {
      state.value.pendingInput = options.preloadedMessage
    }
  }

  function close() {
    state.value.isOpen = false
    state.value.pendingInput = ''
  }

  function clearThread() {
    state.value.thread = []
    state.value.isLongRunning = false
    state.value.pendingExpense = null
  }

  function dismissNotificationPrompt() {
    state.value.thread = state.value.thread.filter(m => !m.notificationPrompt)
    state.value.isLongRunning = false
  }

  function clearPendingExpense() {
    state.value.pendingExpense = null
  }

  async function send(content: string, tabContext?: string) {
    if (!content.trim() || state.value.isStreaming) return

    state.value.pendingInput = ''
    state.value.isLongRunning = false
    state.value.pendingExpense = null

    const userMsg: ChatMessage = { id: nanoid(), role: 'user', content }
    state.value.thread = [...state.value.thread, userMsg]

    const assistantMsg: ChatMessage = { id: nanoid(), role: 'assistant', content: '', isTyping: true }
    state.value.thread = [...state.value.thread, assistantMsg]

    state.value.isStreaming = true

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.value.thread
            .filter(m => !m.isTyping && !m.notificationPrompt)
            .map(m => ({ role: m.role, content: m.content })),
          context: { route: route.path, tabContext },
        }),
      })

      if (!response.ok || !response.body) {
        assistantMsg.content = 'Desculpe, ocorreu um erro. Tente novamente.'
        state.value.thread = [...state.value.thread]
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const parsed = parseAIDataStream(line)
          if (!parsed) continue

          if (parsed.text !== undefined) {
            assistantMsg.content += parsed.text
          }

          if (parsed.data?.longRunning && !state.value.isLongRunning) {
            state.value.isLongRunning = true
            const notifMsg: ChatMessage = {
              id: nanoid(),
              role: 'assistant',
              content: '',
              notificationPrompt: true,
            }
            state.value.thread = [...state.value.thread, notifMsg]
          }

          if (parsed.data?.parsedExpense) {
            state.value.pendingExpense = parsed.data.parsedExpense
            assistantMsg.card = {
              type: 'expense-confirm',
              title: 'Confirmar despesa',
              items: [
                { label: 'Descrição', value: parsed.data.parsedExpense.description },
                {
                  label: 'Valor',
                  value: `R$ ${parsed.data.parsedExpense.amount.toFixed(2).replace('.', ',')}`,
                },
                { label: 'Data', value: parsed.data.parsedExpense.date },
                ...(parsed.data.parsedExpense.installments > 1
                  ? [{ label: 'Parcelas', value: `${parsed.data.parsedExpense.installments}x` }]
                  : []),
              ],
              actions: [
                { label: 'Adicionar', action: 'open-drawer' as const },
                { label: 'Cancelar', action: 'dismiss' as const },
              ],
            }
          }
        }
        state.value.thread = [...state.value.thread]
      }
    } catch {
      assistantMsg.content = 'Desculpe, ocorreu um erro. Tente novamente.'
    } finally {
      assistantMsg.isTyping = false
      state.value.isStreaming = false
      if (state.value.isLongRunning) {
        state.value.thread = state.value.thread.filter(m => !m.notificationPrompt)
        state.value.isLongRunning = false
      }
      state.value.thread = [...state.value.thread]
    }
  }

  return {
    isOpen,
    thread,
    isStreaming,
    pendingInput,
    isLongRunning,
    pendingExpense,
    open,
    close,
    send,
    clearThread,
    dismissNotificationPrompt,
    clearPendingExpense,
  }
}
