# Du Chat FAB — M1: Core FAB Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the ✦ Du Chat FAB — a slide-in panel (desktop) / bottom sheet (mobile) that replaces both existing FABs, supports streaming AI conversation, adds expenses via natural language, and shows a notification prompt for long-running tasks.

**Architecture:** `useChat.ts` composable (Nuxt `useState` singleton) manages global open/close state and the message thread. Streaming is implemented via raw `fetch` + `ReadableStream`, parsing Vercel AI SDK v4 data stream format (no `@ai-sdk/vue` needed). A new `useChatDrawer.ts` composable passes pre-filled expense data from chat → TransactionDrawer. All chat UI components live in `app/components/chat/`. The server route `POST /api/chat` is extended with a `context` body field, `StreamData` metadata emission (longRunning flag + parsedExpense), and inline expense intent detection.

**Tech Stack:** Vue 3.5 + Nuxt 4.2, `useState` from `#app`, Vercel AI SDK v4 (`ai` package, `StreamData`, `streamText`), Tailwind CSS, shadcn-vue (Sheet for desktop, Drawer for mobile), Vitest + `@nuxt/test-utils`.

**M2 and M3 are separate plans.** This plan ends when a user can: open the chat panel, converse with Du, add an expense via natural language, and receive a long-running task notification prompt.

---

## File Map

### Create
| File | Responsibility |
|---|---|
| `app/types/chat.ts` | All shared TypeScript types for chat |
| `server/utils/chat-intent.ts` | Pure function: detect longRunning / expense-add intent |
| `app/composables/useChat.ts` | Global chat state (open/close, thread, send, streaming) |
| `app/composables/useChatContext.ts` | Derive contextual suggestion chips from current route |
| `app/composables/useChatDrawer.ts` | Global state: open TransactionDrawer with pre-filled expense |
| `app/components/chat/ChatFab.vue` | ✦ FAB button (fixed, bottom-right) |
| `app/components/chat/ChatSuggestions.vue` | Opening state: greeting + 5 contextual chips |
| `app/components/chat/ChatResponseCard.vue` | Rich card renderer (category bars, amounts, actions) |
| `app/components/chat/ChatMessage.vue` | Single message: prose + optional card + follow-up chips |
| `app/components/chat/ChatNotificationPrompt.vue` | Long-running task card with notification opt-in |
| `app/components/chat/ChatThread.vue` | Scrollable message list |
| `app/components/chat/ChatPanel.vue` | Desktop slide-in panel (Sheet, right side) |
| `app/components/chat/ChatBottomSheet.vue` | Mobile full-screen bottom sheet (Drawer) |
| `tests/unit/chat-intent.test.ts` | Unit tests for `detectChatIntent` |
| `tests/unit/useChat.test.ts` | Unit tests for `useChat` composable |
| `tests/unit/useChatContext.test.ts` | Unit tests for `useChatContext` composable |

### Modify
| File | Change |
|---|---|
| `server/api/chat.post.ts` | Accept `context`, emit `StreamData` metadata (longRunning, parsedExpense) |
| `app/components/transaction/TransactionDrawer.vue` | Add `prefilled` prop to skip AI mode and show parsed form directly |
| `app/layouts/default.vue` | Replace `GlobalQuickAddFab` with `ChatFab` + `ChatPanel` + `ChatBottomSheet` + chat-driven `TransactionDrawer` |

### Delete
| File | Reason |
|---|---|
| `app/components/layout/GlobalQuickAddFab.vue` | Replaced by ChatFab |

---

## Task 1: Shared Types

**Files:**
- Create: `app/types/chat.ts`

- [ ] **Step 1: Create the types file**

```typescript
// app/types/chat.ts

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  card?: ResponseCard
  followUpChips?: string[]
  isTyping?: boolean
  notificationPrompt?: boolean
  parsedExpense?: ParsedExpenseResult
}

export interface ResponseCard {
  type: 'spending-analysis' | 'expense-confirm' | 'budget-status' | 'generic'
  title: string
  items?: CardItem[]
  verdict?: string
  actions?: ChatAction[]
}

export interface CardItem {
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  barPercent?: number
}

export interface ChatAction {
  label: string
  action: 'open-drawer' | 'navigate' | 'dismiss'
  payload?: Record<string, unknown>
}

export interface ParsedExpenseResult {
  description: string
  amount: number
  date: string
  installments: number
  cardId: string | null
  categoryId: string | null
}

export interface ChatContext {
  route: string
  tabContext: string
}

export interface ContextualSuggestion {
  label: string
  message: string
}

export interface ChatStreamMetadata {
  longRunning?: boolean
  parsedExpense?: ParsedExpenseResult
}
```

- [ ] **Step 2: Commit**

```bash
git add app/types/chat.ts
git commit -m "feat(LUM-187): add shared chat types"
```

---

## Task 2: Server — Intent Detection Utility

**Files:**
- Create: `server/utils/chat-intent.ts`
- Test: `tests/unit/chat-intent.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/chat-intent.test.ts
import { describe, it, expect } from 'vitest'
import { detectChatIntent } from '../../server/utils/chat-intent'

describe('detectChatIntent', () => {
  describe('isLongRunning', () => {
    it('detects "análise profunda"', () => {
      expect(detectChatIntent('quero uma análise profunda').isLongRunning).toBe(true)
    })
    it('detects "6 meses"', () => {
      expect(detectChatIntent('analisa meus gastos de 6 meses').isLongRunning).toBe(true)
    })
    it('detects "semestral"', () => {
      expect(detectChatIntent('relatório semestral').isLongRunning).toBe(true)
    })
    it('does not flag normal messages', () => {
      expect(detectChatIntent('por que minha fatura está alta?').isLongRunning).toBe(false)
    })
  })

  describe('isExpenseAdd', () => {
    it('detects "gastei"', () => {
      expect(detectChatIntent('gastei R$50 no Spoleto').isExpenseAdd).toBe(true)
    })
    it('detects "comprei"', () => {
      expect(detectChatIntent('comprei um livro por R$40').isExpenseAdd).toBe(true)
    })
    it('detects "paguei"', () => {
      expect(detectChatIntent('paguei R$120 na farmácia').isExpenseAdd).toBe(true)
    })
    it('detects "comi"', () => {
      expect(detectChatIntent('comi no McDonald\'s por R$35').isExpenseAdd).toBe(true)
    })
    it('does not flag questions', () => {
      expect(detectChatIntent('por que minha fatura está alta?').isExpenseAdd).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/chat-intent.test.ts
```

Expected: FAIL — `cannot find module '../../server/utils/chat-intent'`

- [ ] **Step 3: Create the utility**

```typescript
// server/utils/chat-intent.ts

export interface ChatIntent {
  isLongRunning: boolean
  isExpenseAdd: boolean
}

export function detectChatIntent(message: string): ChatIntent {
  return {
    isLongRunning: /6 meses|análise profunda|semestral|análise completa/i.test(message),
    isExpenseAdd: /gastei|comprei|paguei|adquiri|comi|almocei|jantei/i.test(message),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/chat-intent.test.ts
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/utils/chat-intent.ts tests/unit/chat-intent.test.ts
git commit -m "feat(LUM-187): add chat intent detection utility with tests"
```

---

## Task 3: Server — Update POST /api/chat

**Files:**
- Modify: `server/api/chat.post.ts`

The update adds three things: (1) accept `context` to enrich the system prompt, (2) detect intents before streaming and emit metadata via `StreamData`, (3) inline parse-expense call when an expense-add intent is detected.

- [ ] **Step 1: Read the current parse-expense logic**

Open `server/api/ai/parse-expense.post.ts` and note the Zod schema and `generateObject` call — you'll need to replicate the core logic as a server utility function in step 2.

- [ ] **Step 2: Create a shared parse-expense utility**

```typescript
// server/utils/parse-expense-inline.ts
import { generateObject } from 'ai'
import { gateway } from './ai'
import { z } from 'zod'
import type { ParsedExpenseResult } from '~/types/chat'

const expenseSchema = z.object({
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  installments: z.number().int().min(1).default(1),
  cardId: z.string().nullable(),
  categoryId: z.string().nullable(),
})

export async function parseExpenseInline(
  text: string,
  cards: Array<{ id: string; name: string }>,
  categories: Array<{ id: string; name: string }>
): Promise<ParsedExpenseResult | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { object } = await generateObject({
      model: gateway('gpt-4o-mini'),
      schema: expenseSchema,
      prompt: `Extraia os dados da seguinte despesa em português brasileiro.
Data de hoje: ${today}
Cartões disponíveis: ${cards.map(c => `${c.id}:${c.name}`).join(', ') || 'nenhum'}
Categorias disponíveis: ${categories.map(c => `${c.id}:${c.name}`).join(', ') || 'nenhuma'}
Use null para cardId/categoryId se não encontrar correspondência.
Despesa: "${text}"`,
    })
    // Sanitize "null" strings
    return {
      ...object,
      cardId: object.cardId === 'null' ? null : object.cardId,
      categoryId: object.categoryId === 'null' ? null : object.categoryId,
    }
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Update `server/api/chat.post.ts`**

Replace the full file with:

```typescript
import { streamText, StreamData } from 'ai'
import { gateway } from '../utils/ai'
import prisma from '../utils/prisma'
import { enforceRateLimit } from '../utils/ai-rate-limit'
import { detectChatIntent } from '../utils/chat-intent'
import { parseExpenseInline } from '../utils/parse-expense-inline'
import { z } from 'zod'

const messageSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  context: z.object({
    route: z.string().optional(),
    tabContext: z.string().optional(),
  }).optional(),
})

export default defineEventHandler(async (event) => {
  const appUser = await getOrCreateUser(event)
  const userId = appUser.userId

  enforceTierAccess(await checkAndIncrementUsage(appUser.dbUserId, appUser.tier, 'ai_chat'))
  enforceRateLimit(`ai:chat:${userId}`, 20, 60 * 1000)

  const body = await readBody(event)
  const { messages, context } = messageSchema.parse(body)

  const lastMessage = messages.at(-1)?.content ?? ''
  const intent = detectChatIntent(lastMessage)

  // Fetch user financial context
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const [cards, installments, categories] = await Promise.all([
    prisma.creditCard.findMany({ where: { userId }, select: { id: true, name: true, limit: true, budget: true } }),
    prisma.installment.findMany({
      where: { dueDate: { gte: startDate, lte: endDate }, transaction: { userId } },
      include: { transaction: { include: { category: { select: { name: true } } } } },
    }),
    prisma.category.findMany({ where: { userId }, select: { id: true, name: true } }),
  ])

  const totalSpent = installments.reduce((sum, i) => sum + i.amount.toNumber(), 0)
  const categorySpending: Record<string, number> = {}
  for (const inst of installments) {
    const cat = inst.transaction.category.name
    categorySpending[cat] = (categorySpending[cat] ?? 0) + inst.amount.toNumber()
  }

  const contextNote = context?.tabContext
    ? `\nContexto atual do usuário: ${context.tabContext}`
    : ''

  const systemPrompt = `Você é a Du, assistente financeira inteligente do app Du. Você ajuda brasileiros a entender e melhorar sua vida financeira.

CONTEXTO DO USUÁRIO (${month}/${year}):${contextNote}
- Total gasto este mês: R$ ${totalSpent.toFixed(2)}
- Cartões: ${cards.map(c => `${c.name} (limite R$ ${c.limit.toFixed(2)}, orçamento R$ ${c.budget?.toFixed(2) ?? 'N/A'})`).join(', ') || 'Nenhum'}
- Gastos por categoria: ${Object.entries(categorySpending).map(([k, v]) => `${k}: R$ ${v.toFixed(2)}`).join(', ') || 'Nenhum gasto'}
- Categorias: ${categories.map(c => c.name).join(', ') || 'Nenhuma'}

REGRAS:
- Responda sempre em português brasileiro, tom amigável e direto (estilo NuBank/Du)
- Valores monetários sempre em formato brasileiro (R$ X.XXX,XX)
- Seja concisa — respostas curtas e úteis
- Quando possível, dê insights acionáveis baseados nos dados reais do usuário
- Nunca invente dados — use apenas o contexto fornecido`

  const data = new StreamData()

  // Emit metadata before streaming begins
  if (intent.isLongRunning) {
    data.append({ longRunning: true })
  }

  if (intent.isExpenseAdd) {
    const parsed = await parseExpenseInline(lastMessage, cards, categories)
    if (parsed) {
      data.append({ parsedExpense: parsed })
    }
  }

  const result = streamText({
    model: gateway('gpt-4o-mini'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
    maxTokens: 800,
    onFinish: () => {
      data.close()
    },
  })

  return result.toDataStreamResponse({ data })
})
```

- [ ] **Step 4: Run linter to catch any type errors**

```bash
npm run lint
```

Expected: no new errors (pre-existing Decimal type issues in other server files are not your concern)

- [ ] **Step 5: Commit**

```bash
git add server/api/chat.post.ts server/utils/chat-intent.ts server/utils/parse-expense-inline.ts
git commit -m "feat(LUM-187): extend /api/chat with context, longRunning flag, and inline expense parsing"
```

---

## Task 4: useChatDrawer Composable

Manages the global state for opening TransactionDrawer from outside with pre-filled parsed data.

**Files:**
- Create: `app/composables/useChatDrawer.ts`

- [ ] **Step 1: Create the composable**

```typescript
// app/composables/useChatDrawer.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/useChatDrawer.ts
git commit -m "feat(LUM-187): add useChatDrawer composable for chat-driven expense entry"
```

---

## Task 5: Add `prefilled` Prop to TransactionDrawer

When the drawer is opened with a pre-parsed expense, skip the AI text step and populate form fields directly.

**Files:**
- Modify: `app/components/transaction/TransactionDrawer.vue`

- [ ] **Step 1: Read lines 44–100 of TransactionDrawer to confirm current prop/state structure**

(Already read above: `props.open`, `props.transactionId`, `aiText`, `isAiMode`, `amount`, `description`, `selectedCardId`, `selectedCategoryId`, `installments`, `purchaseDate`)

- [ ] **Step 2: Add the `prefilled` prop and a watcher**

After `const props = defineProps<{...}>()` block (line 45), add `prefilled` to the interface:

```typescript
const props = defineProps<{
  open: boolean
  transactionId?: string | null
  prefilled?: {
    description: string
    amount: number
    date: string
    installments: number
    cardId: string | null
    categoryId: string | null
  } | null
}>()
```

Then, after the existing `watch(() => props.open, ...)` watcher, add a watcher for `prefilled`:

```typescript
watch(() => props.prefilled, (val) => {
  if (!val) return
  isAiMode.value = false
  description.value = val.description
  amount.value = val.amount
  purchaseDate.value = val.date
  installments.value = [val.installments]
  paymentType.value = val.installments > 1 ? 'installment' : 'cash'
  if (val.cardId) selectedCardId.value = val.cardId
  if (val.categoryId) selectedCategoryId.value = val.categoryId
}, { immediate: true })
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add app/components/transaction/TransactionDrawer.vue
git commit -m "feat(LUM-187): add prefilled prop to TransactionDrawer for chat-driven expense entry"
```

---

## Task 6: useChat Composable

Global chat state and streaming. Uses `useState` for SSR compatibility. Parses the Vercel AI SDK v4 data stream format manually (no `@ai-sdk/vue` needed).

**Files:**
- Create: `app/composables/useChat.ts`
- Test: `tests/unit/useChat.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/useChat.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Minimal Nuxt mock for useState
vi.mock('#app', () => ({
  useState: (key: string, init: () => unknown) => {
    const { ref } = require('vue')
    return ref(init())
  },
  useRoute: () => ({ path: '/dashboard' }),
}))

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/useChat.test.ts
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the composable**

```typescript
// app/composables/useChat.ts
import type { ChatMessage, ChatStreamMetadata, ParsedExpenseResult } from '~/types/chat'

interface ChatState {
  isOpen: boolean
  thread: ChatMessage[]
  isStreaming: boolean
  pendingInput: string
  isLongRunning: boolean
  pendingExpense: ParsedExpenseResult | null
}

const state = useState<ChatState>('du-chat', () => ({
  isOpen: false,
  thread: [],
  isStreaming: false,
  pendingInput: '',
  isLongRunning: false,
  pendingExpense: null,
}))

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
    const last = state.value.thread.at(-1)
    if (last?.notificationPrompt) {
      state.value.thread = state.value.thread.filter(m => !m.notificationPrompt)
    }
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
    state.value.thread.push(userMsg)

    const assistantMsg: ChatMessage = { id: nanoid(), role: 'assistant', content: '', isTyping: true }
    state.value.thread.push(assistantMsg)

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
        assistantMsg.isTyping = false
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

          if (parsed.data?.longRunning) {
            state.value.isLongRunning = true
            // Insert notification prompt card after the assistant message
            const notifMsg: ChatMessage = {
              id: nanoid(),
              role: 'assistant',
              content: '',
              notificationPrompt: true,
            }
            state.value.thread.push(notifMsg)
          }

          if (parsed.data?.parsedExpense) {
            state.value.pendingExpense = parsed.data.parsedExpense
            assistantMsg.card = {
              type: 'expense-confirm',
              title: 'Confirmar despesa',
              items: [
                { label: 'Descrição', value: parsed.data.parsedExpense.description },
                { label: 'Valor', value: `R$ ${parsed.data.parsedExpense.amount.toFixed(2).replace('.', ',')}` },
                { label: 'Data', value: parsed.data.parsedExpense.date },
                ...(parsed.data.parsedExpense.installments > 1
                  ? [{ label: 'Parcelas', value: `${parsed.data.parsedExpense.installments}x` }]
                  : []),
              ],
              actions: [
                { label: 'Adicionar', action: 'open-drawer' },
                { label: 'Cancelar', action: 'dismiss' },
              ],
            }
          }
        }
        // Sync the thread array to trigger reactivity
        state.value.thread = [...state.value.thread]
      }
    } catch {
      assistantMsg.content = 'Desculpe, ocorreu um erro. Tente novamente.'
    } finally {
      assistantMsg.isTyping = false
      state.value.isStreaming = false
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/unit/useChat.test.ts
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/composables/useChat.ts tests/unit/useChat.test.ts
git commit -m "feat(LUM-187): add useChat composable with streaming and expense-parse support"
```

---

## Task 7: useChatContext Composable

Derives the 5 contextual suggestion chips from the current route.

**Files:**
- Create: `app/composables/useChatContext.ts`
- Test: `tests/unit/useChatContext.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/unit/useChatContext.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('#app', () => ({
  useState: (_key: string, init: () => unknown) => {
    const { ref } = require('vue')
    return ref(init())
  },
  useRoute: vi.fn(),
}))

import { useChatContext } from '../../app/composables/useChatContext'
import { useRoute } from '#app'

describe('useChatContext', () => {
  it('returns credit card suggestions on /dashboard with cartao tab', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/dashboard', query: { tab: 'cartao' } } as ReturnType<typeof useRoute>)
    const { suggestions, greeting } = useChatContext()
    expect(suggestions.value).toHaveLength(5)
    expect(suggestions.value[0].message).toContain('adicionar')
    expect(greeting.value).toContain('Cartão')
  })

  it('returns cash flow suggestions on /dashboard with fluxo tab', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/dashboard', query: { tab: 'fluxo' } } as ReturnType<typeof useRoute>)
    const { suggestions } = useChatContext()
    expect(suggestions.value.some(s => s.message.includes('orçamento'))).toBe(true)
  })

  it('returns installment suggestions on /parcelamentos', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/parcelamentos', query: {} } as ReturnType<typeof useRoute>)
    const { suggestions } = useChatContext()
    expect(suggestions.value.some(s => s.message.includes('parcelamento'))).toBe(true)
  })

  it('always returns exactly 5 suggestions', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/unknown-page', query: {} } as ReturnType<typeof useRoute>)
    const { suggestions } = useChatContext()
    expect(suggestions.value).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/useChatContext.test.ts
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement the composable**

```typescript
// app/composables/useChatContext.ts
import type { ContextualSuggestion } from '~/types/chat'

const SUGGESTIONS: Record<string, ContextualSuggestion[]> = {
  cartao: [
    { label: 'Adicionar despesa', message: 'quero adicionar uma despesa' },
    { label: 'Por que minha fatura está alta?', message: 'por que minha fatura está alta?' },
    { label: 'Comparar com o mês passado', message: 'compare meus gastos com o mês passado' },
    { label: 'Análise profunda (6 meses)', message: 'faça uma análise profunda dos meus gastos de 6 meses' },
    { label: 'Projeção desta fatura', message: 'qual é a projeção da minha fatura este mês?' },
  ],
  fluxo: [
    { label: 'Como está meu orçamento?', message: 'como está meu orçamento este mês?' },
    { label: 'Quanto tenho livre?', message: 'quanto tenho livre para gastar?' },
    { label: 'Meta de economia', message: 'quero definir uma meta de economia' },
    { label: 'Análise de categorias', message: 'analisa meus gastos por categoria' },
    { label: 'O que vem essa semana?', message: 'o que vem pela frente essa semana?' },
  ],
  parcelamentos: [
    { label: 'Qual quitar primeiro?', message: 'qual parcelamento devo quitar primeiro?' },
    { label: 'Simular quitação', message: 'quanto economizo quitando meus parcelamentos?' },
    { label: 'Resumo de parcelas', message: 'me dá um resumo de todos os meus parcelamentos' },
    { label: 'Parcelas do próximo mês', message: 'quais parcelas vencem no próximo mês?' },
    { label: 'Adicionar despesa', message: 'quero adicionar uma despesa parcelada' },
  ],
  default: [
    { label: 'Adicionar despesa', message: 'quero adicionar uma despesa' },
    { label: 'Como está meu orçamento?', message: 'como está meu orçamento este mês?' },
    { label: 'Ver gastos de hoje', message: 'quais foram meus gastos de hoje?' },
    { label: 'Análise de categorias', message: 'analisa meus gastos por categoria' },
    { label: 'Dica financeira', message: 'me dá uma dica financeira personalizada' },
  ],
}

const GREETINGS: Record<string, string> = {
  cartao: 'Estou vendo seu Cartão de Crédito',
  fluxo: 'Estou vendo seu Fluxo de Caixa',
  parcelamentos: 'Estou vendo seus Parcelamentos',
  default: 'Como posso ajudar?',
}

export function useChatContext() {
  const route = useRoute()

  const contextKey = computed(() => {
    if (route.path === '/parcelamentos') return 'parcelamentos'
    const tab = String(route.query?.tab ?? '')
    if (tab === 'cartao' || tab === '') return 'cartao' // dashboard default = cartao
    if (tab === 'fluxo') return 'fluxo'
    return 'default'
  })

  const suggestions = computed<ContextualSuggestion[]>(
    () => SUGGESTIONS[contextKey.value] ?? SUGGESTIONS.default
  )

  const greeting = computed(() => GREETINGS[contextKey.value] ?? GREETINGS.default)

  return { suggestions, greeting, contextKey }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/unit/useChatContext.test.ts
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/composables/useChatContext.ts tests/unit/useChatContext.test.ts
git commit -m "feat(LUM-187): add useChatContext composable with route-based suggestion chips"
```

---

## Task 8: ChatFab Component

**Files:**
- Create: `app/components/chat/ChatFab.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatFab.vue -->
<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const { isOpen, open, close } = useChat()
const route = useRoute()

const shouldShow = computed(() => route.path !== '/onboarding')

function toggle() {
  if (isOpen.value) close()
  else open()
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const tag = target.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if ((event.key === 'a' || event.key === 'A') && shouldShow.value) {
    event.preventDefault()
    toggle()
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <ClientOnly>
    <Transition name="fab-pop">
      <button
        v-if="shouldShow"
        class="fixed bottom-8 right-8 z-50 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.6)] hover:scale-105 active:scale-[0.97] transition-all duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        :aria-label="isOpen ? 'Fechar Du Chat' : 'Abrir Du Chat'"
        :aria-expanded="isOpen"
        @click="toggle"
      >
        <span class="text-xl font-bold leading-none select-none" aria-hidden="true">✦</span>
      </button>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
.fab-pop-enter-active,
.fab-pop-leave-active {
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease-out;
}
.fab-pop-enter-from,
.fab-pop-leave-to {
  transform: scale(0.6);
  opacity: 0;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatFab.vue
git commit -m "feat(LUM-187): add ChatFab component"
```

---

## Task 9: ChatSuggestions Component

**Files:**
- Create: `app/components/chat/ChatSuggestions.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatSuggestions.vue -->
<script setup lang="ts">
import { useChatContext } from '@/composables/useChatContext'

const emit = defineEmits<{
  selectSuggestion: [message: string]
}>()

const props = defineProps<{
  userName?: string
}>()

const { suggestions, greeting } = useChatContext()

const displayName = computed(() => props.userName ?? 'você')
</script>

<template>
  <div class="flex flex-col gap-5 p-4">
    <!-- Greeting -->
    <div class="flex flex-col gap-1">
      <p class="text-sm text-muted-foreground">{{ greeting }}.</p>
      <p class="text-base font-medium leading-snug">
        Oi, {{ displayName }}! O que posso fazer por você?
      </p>
    </div>

    <!-- Suggestion chips -->
    <div class="flex flex-col gap-2">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.message"
        class="w-full rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted hover:border-primary/30 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        @click="emit('selectSuggestion', suggestion.message)"
      >
        {{ suggestion.label }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatSuggestions.vue
git commit -m "feat(LUM-187): add ChatSuggestions component"
```

---

## Task 10: ChatResponseCard Component

Renders the rich structured card inside a Du message — spending analysis, expense confirmation, etc.

**Files:**
- Create: `app/components/chat/ChatResponseCard.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatResponseCard.vue -->
<script setup lang="ts">
import { useChatDrawer } from '@/composables/useChatDrawer'
import { useChat } from '@/composables/useChat'
import type { ResponseCard } from '~/types/chat'

const props = defineProps<{
  card: ResponseCard
}>()

const emit = defineEmits<{
  actionClicked: [action: string, payload?: Record<string, unknown>]
}>()

const drawer = useChatDrawer()
const chat = useChat()

function handleAction(action: string, payload?: Record<string, unknown>) {
  if (action === 'open-drawer' && chat.pendingExpense.value) {
    drawer.openWithParsed(chat.pendingExpense.value)
    chat.clearPendingExpense()
  } else if (action === 'dismiss') {
    chat.clearPendingExpense()
  }
  emit('actionClicked', action, payload)
}
</script>

<template>
  <div class="mt-2 rounded-xl border border-border bg-card overflow-hidden">
    <!-- Card header -->
    <div class="px-4 py-3 border-b border-border/60">
      <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {{ card.title }}
      </p>
    </div>

    <!-- Items (spending analysis rows, expense details, etc.) -->
    <div v-if="card.items?.length" class="px-4 py-3 flex flex-col gap-2.5">
      <div
        v-for="item in card.items"
        :key="item.label"
        class="flex items-center justify-between gap-3"
      >
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground truncate">{{ item.label }}</span>
            <span
              v-if="item.delta"
              class="text-xs font-medium shrink-0"
              :class="item.deltaPositive ? 'text-success' : 'text-destructive'"
            >
              {{ item.delta }}
            </span>
          </div>
          <!-- Bar (spending analysis) -->
          <div v-if="item.barPercent !== undefined" class="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${Math.min(item.barPercent, 100)}%` }"
            />
          </div>
        </div>
        <span class="text-sm font-semibold shrink-0 tabular-nums">{{ item.value }}</span>
      </div>
    </div>

    <!-- Verdict -->
    <div v-if="card.verdict" class="px-4 pb-3">
      <p class="text-xs text-muted-foreground leading-relaxed">{{ card.verdict }}</p>
    </div>

    <!-- Actions -->
    <div v-if="card.actions?.length" class="px-4 pb-3 flex flex-wrap gap-2">
      <button
        v-for="action in card.actions"
        :key="action.label"
        class="rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        :class="action.action === 'open-drawer'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 active:scale-[0.97]'"
        @click="handleAction(action.action, action.payload)"
      >
        {{ action.label }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatResponseCard.vue
git commit -m "feat(LUM-187): add ChatResponseCard component"
```

---

## Task 11: ChatMessage Component

Renders a single message bubble — user (right) or assistant (left with ✦ avatar, card, follow-up chips).

**Files:**
- Create: `app/components/chat/ChatMessage.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatMessage.vue -->
<script setup lang="ts">
import ChatResponseCard from './ChatResponseCard.vue'
import ChatNotificationPrompt from './ChatNotificationPrompt.vue'
import type { ChatMessage } from '~/types/chat'

const props = defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  selectChip: [message: string]
}>()
</script>

<template>
  <!-- Notification prompt card (special full-width message) -->
  <div v-if="message.notificationPrompt" class="px-4 py-2">
    <ChatNotificationPrompt />
  </div>

  <!-- User message -->
  <div v-else-if="message.role === 'user'" class="flex justify-end px-4 py-1">
    <div class="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5">
      <p class="text-sm leading-relaxed text-secondary-foreground">{{ message.content }}</p>
    </div>
  </div>

  <!-- Assistant message -->
  <div v-else class="flex items-start gap-3 px-4 py-1">
    <!-- ✦ avatar -->
    <div class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
      <span class="text-xs font-bold leading-none select-none" aria-hidden="true">✦</span>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-2">
      <!-- Typing indicator -->
      <div v-if="message.isTyping" class="flex items-center gap-1 py-1">
        <span v-for="i in 3" :key="i" class="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" :style="{ animationDelay: `${(i - 1) * 150}ms` }" />
      </div>

      <!-- Prose content -->
      <p v-else-if="message.content" class="text-sm leading-relaxed">{{ message.content }}</p>

      <!-- Rich card -->
      <ChatResponseCard v-if="message.card && !message.isTyping" :card="message.card" />

      <!-- Follow-up chips -->
      <div v-if="message.followUpChips?.length && !message.isTyping" class="flex flex-wrap gap-1.5 pt-1">
        <button
          v-for="chip in message.followUpChips"
          :key="chip"
          class="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/30 active:scale-[0.97] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          @click="emit('selectChip', chip)"
        >
          {{ chip }}
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatMessage.vue
git commit -m "feat(LUM-187): add ChatMessage component"
```

---

## Task 12: ChatNotificationPrompt Component

Card shown inside the thread when a long-running task is detected. Has "notify me" + "wait here" actions.

**Files:**
- Create: `app/components/chat/ChatNotificationPrompt.vue`

- [ ] **Step 1: Create the component**

Web Push permission (`Notification.requestPermission()`) is called when the user taps "Me avise". In M1 the subscription isn't stored server-side yet (that's M3), but the permission request is wired up so the browser prompt appears. The "Aguardar aqui" button simply dismisses the prompt and keeps the panel open.

```vue
<!-- app/components/chat/ChatNotificationPrompt.vue -->
<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const chat = useChat()
const requested = ref(false)
const granted = ref(false)

async function requestNotification() {
  if (!('Notification' in window)) {
    requested.value = true
    return
  }
  const permission = await Notification.requestPermission()
  granted.value = permission === 'granted'
  requested.value = true
}

function waitHere() {
  chat.dismissNotificationPrompt()
}
</script>

<template>
  <div class="rounded-xl border border-border bg-muted/40 p-4 flex flex-col gap-3">
    <!-- Header row -->
    <div class="flex items-start gap-3">
      <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <span class="text-sm" aria-hidden="true">⏳</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold leading-snug">Análise em andamento</p>
        <p class="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          Isso pode levar até 30 segundos. Posso te avisar quando terminar.
        </p>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="h-1 rounded-full bg-border overflow-hidden">
      <div class="h-full w-full rounded-full bg-primary origin-left animate-[indeterminate_1.8s_ease-in-out_infinite]" />
    </div>

    <!-- Actions -->
    <div v-if="!requested" class="flex flex-col gap-2">
      <button
        class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        @click="requestNotification"
      >
        🔔 Me avise quando terminar
      </button>
      <button
        class="w-full rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-muted/80 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        @click="waitHere"
      >
        Aguardar aqui
      </button>
      <p class="text-center text-[10px] text-muted-foreground/70">
        Notificação do navegador, funciona mesmo com a aba minimizada
      </p>
    </div>

    <p v-else class="text-xs text-center text-muted-foreground">
      {{ granted ? '✓ Você será notificado quando terminar' : 'Aguardando resultado…' }}
    </p>
  </div>
</template>

<style scoped>
@keyframes indeterminate {
  0%   { transform: translateX(-100%) scaleX(0.5); }
  50%  { transform: translateX(0%) scaleX(0.8); }
  100% { transform: translateX(100%) scaleX(0.5); }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatNotificationPrompt.vue
git commit -m "feat(LUM-187): add ChatNotificationPrompt component"
```

---

## Task 13: ChatThread Component

**Files:**
- Create: `app/components/chat/ChatThread.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatThread.vue -->
<script setup lang="ts">
import ChatMessage from './ChatMessage.vue'
import ChatSuggestions from './ChatSuggestions.vue'
import { useChat } from '@/composables/useChat'

const emit = defineEmits<{
  selectSuggestion: [message: string]
}>()

const props = defineProps<{
  userName?: string
}>()

const chat = useChat()
const threadEl = ref<HTMLElement | null>(null)

const isEmpty = computed(() => chat.thread.value.length === 0)

watch(
  () => chat.thread.value.length,
  async () => {
    await nextTick()
    if (threadEl.value) {
      threadEl.value.scrollTop = threadEl.value.scrollHeight
    }
  }
)
</script>

<template>
  <div ref="threadEl" class="flex-1 overflow-y-auto overscroll-contain py-2 scroll-smooth">
    <!-- Opening state -->
    <ChatSuggestions
      v-if="isEmpty"
      :user-name="props.userName"
      @select-suggestion="emit('selectSuggestion', $event)"
    />

    <!-- Message thread -->
    <div v-else class="flex flex-col gap-1 pb-4">
      <ChatMessage
        v-for="msg in chat.thread.value"
        :key="msg.id"
        :message="msg"
        @select-chip="emit('selectSuggestion', $event)"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatThread.vue
git commit -m "feat(LUM-187): add ChatThread component"
```

---

## Task 14: Chat Input (shared sub-component)

This is a shared footer used by both `ChatPanel` and `ChatBottomSheet`. Extract it to avoid duplication.

**Files:**
- Create: `app/components/chat/ChatInput.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatInput.vue -->
<script setup lang="ts">
import { useChat } from '@/composables/useChat'
import { Send } from 'lucide-vue-next'

const chat = useChat()
const inputEl = ref<HTMLTextAreaElement | null>(null)

const localInput = ref('')

// When pendingInput is set externally (preloaded message), sync it
watch(
  () => chat.pendingInput.value,
  (val) => {
    if (val) {
      localInput.value = val
      nextTick(() => inputEl.value?.focus())
    }
  },
  { immediate: true }
)

const props = defineProps<{
  tabContext?: string
}>()

function submit() {
  const msg = localInput.value.trim()
  if (!msg || chat.isStreaming.value) return
  localInput.value = ''
  chat.send(msg, props.tabContext)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="border-t border-border px-4 py-3">
    <div class="flex items-end gap-2 rounded-xl bg-muted/50 border border-border px-3 py-2 focus-within:border-primary/50 transition-colors">
      <textarea
        ref="inputEl"
        v-model="localInput"
        rows="1"
        placeholder="Pergunte algo ao Du…"
        class="flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 max-h-32 overflow-y-auto"
        :disabled="chat.isStreaming.value"
        @keydown="handleKeydown"
        @input="($event.target as HTMLTextAreaElement).style.height = 'auto'; ($event.target as HTMLTextAreaElement).style.height = ($event.target as HTMLTextAreaElement).scrollHeight + 'px'"
      />
      <button
        :disabled="!localInput.trim() || chat.isStreaming.value"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 active:scale-[0.95] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label="Enviar mensagem"
        @click="submit"
      >
        <Send class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatInput.vue
git commit -m "feat(LUM-187): add ChatInput shared sub-component"
```

---

## Task 15: ChatPanel Component (Desktop)

Right-side slide-in panel using shadcn-vue `Sheet`. Visible only on `lg+` screens.

**Files:**
- Create: `app/components/chat/ChatPanel.vue`

- [ ] **Step 1: Check available shadcn Sheet variants**

```bash
grep -r "SheetContent" app/components/ui/sheet/ | head -5
```

Confirm there's a `side` prop accepting `'right'`. If the component is at `app/components/ui/sheet/SheetContent.vue`, it should accept `side="right"` via cva variants.

- [ ] **Step 2: Create the component**

```vue
<!-- app/components/chat/ChatPanel.vue -->
<script setup lang="ts">
import { Sheet, SheetContent } from '@/components/ui/sheet'
import ChatThread from './ChatThread.vue'
import ChatInput from './ChatInput.vue'
import { useChat } from '@/composables/useChat'
import { useChatContext } from '@/composables/useChatContext'
import { X } from 'lucide-vue-next'

const chat = useChat()
const { contextKey } = useChatContext()

function handleSelectSuggestion(message: string) {
  chat.send(message, contextKey.value)
}
</script>

<template>
  <!-- Desktop only: lg+ -->
  <ClientOnly>
    <Sheet :open="chat.isOpen.value" @update:open="(v) => v ? chat.open() : chat.close()">
      <SheetContent
        side="right"
        class="hidden lg:flex w-[420px] flex-col p-0 gap-0 border-l border-border bg-background"
        :class="{ 'pointer-events-none': false }"
      >
        <!-- Header -->
        <div class="flex items-center gap-2.5 border-b border-border px-5 py-4 shrink-0">
          <span class="text-xl leading-none select-none" aria-hidden="true">👋</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-extrabold leading-tight tracking-tight">Du</p>
            <p class="text-[11px] text-muted-foreground leading-none mt-0.5">Seu coach financeiro</p>
          </div>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Fechar Du Chat"
            @click="chat.close()"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- Thread -->
        <ChatThread
          class="flex-1 min-h-0"
          @select-suggestion="handleSelectSuggestion"
        />

        <!-- Input -->
        <ChatInput :tab-context="contextKey" />
      </SheetContent>
    </Sheet>
  </ClientOnly>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add app/components/chat/ChatPanel.vue
git commit -m "feat(LUM-187): add ChatPanel desktop slide-in component"
```

---

## Task 16: ChatBottomSheet Component (Mobile)

Full-screen bottom sheet using shadcn-vue `Drawer`. Visible only on `< lg` screens.

**Files:**
- Create: `app/components/chat/ChatBottomSheet.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- app/components/chat/ChatBottomSheet.vue -->
<script setup lang="ts">
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import ChatThread from './ChatThread.vue'
import ChatInput from './ChatInput.vue'
import { useChat } from '@/composables/useChat'
import { useChatContext } from '@/composables/useChatContext'
import { X } from 'lucide-vue-next'

const chat = useChat()
const { contextKey } = useChatContext()

function handleSelectSuggestion(message: string) {
  chat.send(message, contextKey.value)
}
</script>

<template>
  <!-- Mobile only: < lg -->
  <ClientOnly>
    <Drawer :open="chat.isOpen.value" @update:open="(v) => v ? chat.open() : chat.close()">
      <DrawerContent class="lg:hidden flex flex-col h-[92dvh] p-0 gap-0">
        <!-- Header -->
        <DrawerHeader class="flex items-center gap-2.5 border-b border-border px-5 py-4 shrink-0">
          <span class="text-xl leading-none select-none" aria-hidden="true">👋</span>
          <DrawerTitle class="flex-1 min-w-0 text-left">
            <span class="text-sm font-extrabold leading-tight tracking-tight">Du</span>
            <span class="block text-[11px] text-muted-foreground leading-none mt-0.5 font-normal">Seu coach financeiro</span>
          </DrawerTitle>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Fechar Du Chat"
            @click="chat.close()"
          >
            <X class="h-4 w-4" />
          </button>
        </DrawerHeader>

        <!-- Thread -->
        <ChatThread
          class="flex-1 min-h-0"
          @select-suggestion="handleSelectSuggestion"
        />

        <!-- Input -->
        <ChatInput :tab-context="contextKey" />
      </DrawerContent>
    </Drawer>
  </ClientOnly>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/chat/ChatBottomSheet.vue
git commit -m "feat(LUM-187): add ChatBottomSheet mobile component"
```

---

## Task 17: Wire Layout + Remove GlobalQuickAddFab

**Files:**
- Modify: `app/layouts/default.vue`
- Delete: `app/components/layout/GlobalQuickAddFab.vue`

- [ ] **Step 1: Update `app/layouts/default.vue`**

Replace the full file with:

```vue
<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import ChatFab from '@/components/chat/ChatFab.vue'
import ChatPanel from '@/components/chat/ChatPanel.vue'
import ChatBottomSheet from '@/components/chat/ChatBottomSheet.vue'
import TransactionDrawer from '@/components/transaction/TransactionDrawer.vue'
import { useChatDrawer } from '@/composables/useChatDrawer'

const chatDrawer = useChatDrawer()
</script>

<template>
  <div class="app-shell min-h-screen bg-background antialiased relative overflow-hidden">
    <DemoBanner />

    <div class="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main class="flex-1 w-full overflow-x-hidden p-4 md:p-6 lg:p-8 lg:pl-[19.5rem] pb-20 lg:pb-8 relative z-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
        <slot />
      </main>
    </div>

    <BottomNav />

    <!-- Du Chat FAB + Panel -->
    <ChatFab />
    <ChatPanel />
    <ChatBottomSheet />

    <!-- Chat-driven expense drawer (separate from dashboard's drawer) -->
    <TransactionDrawer
      :open="chatDrawer.isOpen.value"
      :prefilled="chatDrawer.prefilled.value"
      @update:open="(v) => v ? null : chatDrawer.close()"
      @saved="chatDrawer.close()"
    />

    <!-- PWA Install Prompt -->
    <InstallPrompt />
  </div>
</template>
```

- [ ] **Step 2: Delete the old FAB**

```bash
rm app/components/layout/GlobalQuickAddFab.vue
```

- [ ] **Step 3: Run lint to ensure no remaining imports**

```bash
npm run lint
```

Expected: no errors. If any page still imports `GlobalQuickAddFab`, remove those imports.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: all tests pass (the deleted FAB has no tests to break).

- [ ] **Step 5: Commit**

```bash
git add app/layouts/default.vue
git rm app/components/layout/GlobalQuickAddFab.vue
git commit -m "feat(LUM-187): wire ChatFab/ChatPanel/ChatBottomSheet into layout, remove GlobalQuickAddFab"
```

---

## Task 18: Smoke Test in Browser

Before declaring M1 done, manually verify the golden path.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify FAB**

- The ✦ FAB appears at bottom-right on all pages except `/onboarding`
- Pressing `A` (keyboard) opens the panel
- The old `+` FAB is gone

- [ ] **Step 3: Verify opening state**

- Opening the panel shows the 👋 greeting + 5 suggestion chips
- The chips are contextual (different on Cartão vs Fluxo tab vs /parcelamentos)

- [ ] **Step 4: Verify conversation**

- Typing a message and pressing Enter streams a Du response
- The panel shows typing indicator (three bouncing dots) while streaming

- [ ] **Step 5: Verify expense add flow**

- Type: `gastei R$50 no Spoleto hoje`
- Du responds with an expense-confirm card showing description, amount, date
- Tapping "Adicionar" opens TransactionDrawer pre-filled with the parsed data (not in AI mode — form fields already populated)
- Tapping "Cancelar" dismisses the card

- [ ] **Step 6: Verify long-running task flow**

- Type: `faça uma análise profunda dos meus gastos de 6 meses`
- A notification prompt card appears in the thread within ~1s
- Tapping "🔔 Me avise quando terminar" triggers the browser's notification permission prompt
- Tapping "Aguardar aqui" dismisses the prompt card

- [ ] **Step 7: Verify mobile**

- At viewport width < 1024px, the panel opens as a bottom sheet (full-screen drawer)
- The FAB is visible at the same position

- [ ] **Step 8: Final commit if any minor fixes were made during smoke test**

```bash
git add -p
git commit -m "fix(LUM-187): M1 smoke test fixes"
```

---

## Self-Review

This plan covers all M1 spec requirements:

| Spec requirement | Task |
|---|---|
| ✦ FAB replaces both FABs | Task 8, 17 |
| Slide-in panel desktop / bottom sheet mobile | Tasks 15, 16 |
| Opening state: greeting + 5 contextual chips | Tasks 7, 9 |
| Streaming conversation with typing indicator | Task 6, 11 |
| Add expense via NL → confirmation card → drawer | Tasks 2–5, 10 |
| Long-running task → notification prompt | Tasks 12, 13 |
| Browser notification permission request | Task 12 |
| `GlobalQuickAddFab` removed | Task 17 |

M2 (AI hints badges, toast CTA, context menu, NL filtering) and M3 (persistent history, goal tracking, web push, financial calendar, installment optimizer) are separate plans written when M1 is in production.
