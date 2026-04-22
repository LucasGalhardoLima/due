import { describe, it, expect, vi } from 'vitest'

// Minimal Nuxt mock — useState must behave like a module-level reactive ref
vi.mock('#app', () => {
  const { ref } = require('vue')
  const store: Record<string, ReturnType<typeof ref>> = {}
  return {
    useState: (key: string, init: () => unknown) => {
      if (!store[key]) store[key] = ref(init())
      return store[key]
    },
    useRoute: () => ({ path: '/dashboard', query: {} }),
  }
})

import { useChat } from '../../app/composables/useChat'

describe('useChat', () => {
  it('starts closed', () => {
    const { isOpen } = useChat()
    expect(isOpen.value).toBe(false)
  })

  it('opens the panel', () => {
    const { isOpen, open } = useChat()
    open()
    expect(isOpen.value).toBe(true)
  })

  it('closes the panel', () => {
    const { isOpen, open, close } = useChat()
    open()
    close()
    expect(isOpen.value).toBe(false)
  })

  it('starts with empty thread', () => {
    const { thread } = useChat()
    expect(thread.value).toHaveLength(0)
  })

  it('open with preloadedMessage sets pendingInput', () => {
    const { open, pendingInput } = useChat()
    open({ preloadedMessage: 'Por que minha fatura está alta?' })
    expect(pendingInput.value).toBe('Por que minha fatura está alta?')
  })
})
