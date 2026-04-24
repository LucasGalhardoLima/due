# Du Chat FAB — M2: Context Everywhere

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship M2 of the Du Chat FAB — AI hint badges on 6 dashboard widgets, a right-click/long-press context menu on transactions, natural-language filtering of the transaction list, and a "✦ Perguntar ao Du →" CTA on the proactive advisor toast.

**Architecture:** Four independent additions wired through the existing `useChat` global state. A new `useTransactionFilter` composable (Nuxt `useState` singleton) holds the active filter; `useChat.ts` emits filter events received from the server stream; `TransactionList.vue` reads and applies them. The server extends `chat.post.ts` with `generateObject` filter extraction that fires only when `isFilterIntent` is true. `AiHintBadge.vue` is a drop-in sparkle pill that any widget can render.

**Tech Stack:** Vue 3.5 + Nuxt 4.2, Vercel AI SDK (`generateObject`, `StreamData`), Zod, Tailwind CSS, Vitest

---

## File Map

### Create
| File | Responsibility |
|---|---|
| `app/components/chat/AiHintBadge.vue` | Reusable sparkle pill — "✦ perguntar" — overlaid on widget corners |
| `app/components/transaction/TransactionContextMenu.vue` | Floating popover on right-click / 500ms long-press for any transaction row |
| `app/composables/useTransactionFilter.ts` | Global filter state: `activeFilter`, `applyFilter`, `clearFilter` |
| `tests/unit/useTransactionFilter.test.ts` | Unit tests for filter composable |

### Modify
| File | Change |
|---|---|
| `app/types/chat.ts` | Add `ChatFilterEvent`, `FilterParams`; update `ChatStreamMetadata` |
| `server/utils/chat-intent.ts` | Add `isFilterIntent` flag |
| `server/api/chat.post.ts` | Extract filter params with `generateObject` and emit `filterEvent` metadata |
| `app/composables/useChat.ts` | Handle `filterEvent` from stream; add `openWithAssistantMessage()` |
| `app/components/dashboard/ProactiveAdvisor.vue` | Add "✦ Perguntar ao Du →" CTA button |
| `app/components/transaction/TransactionList.vue` | Add context menu trigger + filter chip display + client-side filtering |
| `app/components/dashboard/DuScoreCard.vue` | Add `AiHintBadge` |
| `app/components/dashboard/SpendingPaceChart.vue` | Add `AiHintBadge` |
| `app/components/dashboard/TrendingBudgetsCard.vue` | Add `AiHintBadge` |
| `app/components/dashboard/UpcomingBillsCard.vue` | Add `AiHintBadge` |
| `app/components/dashboard/FreeToSpendCard.vue` | Add `AiHintBadge` |
| `app/components/dashboard/SummaryCards.vue` | Add `AiHintBadge` to each category mini-card |
| `tests/unit/chat-intent.test.ts` | Add `isFilterIntent` test cases |

---

## Task 1: ChatFilterEvent types + filter intent detection

**Files:**
- Modify: `app/types/chat.ts`
- Modify: `server/utils/chat-intent.ts`
- Modify: `tests/unit/chat-intent.test.ts`

- [ ] **Step 1: Add ChatFilterEvent types to app/types/chat.ts**

Open `app/types/chat.ts`. Add these interfaces after the existing exports:

```typescript
export interface FilterParams {
  merchant?: string
  category?: string
  minAmount?: number
  maxAmount?: number
  dateFrom?: string   // ISO date "YYYY-MM-DD"
  dateTo?: string     // ISO date "YYYY-MM-DD"
  month?: string      // "YYYY-MM" — expanded to dateFrom/dateTo by the composable
  installmentOnly?: boolean
}

export interface ChatFilterEvent {
  type: 'filter:apply' | 'filter:clear'
  filters: FilterParams
}
```

Also update `ChatStreamMetadata` to include `filterEvent?`:

```typescript
export interface ChatStreamMetadata {
  longRunning?: boolean
  parsedExpense?: ParsedExpenseResult
  filterEvent?: ChatFilterEvent   // NEW
}
```

- [ ] **Step 2: Add isFilterIntent to server/utils/chat-intent.ts**

Replace the entire file content:

```typescript
export interface ChatIntent {
  isLongRunning: boolean
  isExpenseAdd: boolean
  isFilterIntent: boolean
}

export function detectChatIntent(message: string): ChatIntent {
  return {
    isLongRunning: /6 meses|análise profunda|semestral|análise completa/i.test(message),
    isExpenseAdd: /gastei|comprei|paguei|adquiri|comi|almocei|jantei/i.test(message)
      && /(R\$|\d+[,.]?\d*\s*(reais?|contos?|pilas?|real)|\d+)/i.test(message),
    isFilterIntent: /^(mostra|mostre|filtra|filtre|quero ver|me mostra|me mostre|ver só|só|apenas)\b/i.test(message)
      || /\b(gastos|transações|compras)\s+(com|de|acima|abaixo|em)\b/i.test(message)
      || /\bacima de\b|\babaixo de\b|\bmaior que\b|\bmenor que\b/i.test(message),
  }
}
```

- [ ] **Step 3: Add filter intent tests to tests/unit/chat-intent.test.ts**

At the end of the existing test file, inside the outer `describe('detectChatIntent')`, add:

```typescript
  describe('isFilterIntent', () => {
    it('detects "mostra gastos com Uber Eats"', () => {
      expect(detectChatIntent('mostra gastos com Uber Eats').isFilterIntent).toBe(true)
    })
    it('detects "transações acima de R$200"', () => {
      expect(detectChatIntent('transações acima de R$200 esse mês').isFilterIntent).toBe(true)
    })
    it('detects "gastos em março"', () => {
      expect(detectChatIntent('gastos em março').isFilterIntent).toBe(true)
    })
    it('detects "filtra por alimentação"', () => {
      expect(detectChatIntent('filtra por alimentação').isFilterIntent).toBe(true)
    })
    it('does not flag expense additions', () => {
      expect(detectChatIntent('gastei R$50 no Spoleto').isFilterIntent).toBe(false)
    })
    it('does not flag analysis requests', () => {
      expect(detectChatIntent('por que minha fatura está alta?').isFilterIntent).toBe(false)
    })
  })
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/unit/chat-intent.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/types/chat.ts server/utils/chat-intent.ts tests/unit/chat-intent.test.ts
git commit -m "feat(m2): add ChatFilterEvent types and isFilterIntent detection"
```

---

## Task 2: useTransactionFilter composable

**Files:**
- Create: `app/composables/useTransactionFilter.ts`
- Create: `tests/unit/useTransactionFilter.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/useTransactionFilter.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/useTransactionFilter.test.ts
```

Expected: FAIL — `Cannot find module '../../app/composables/useTransactionFilter'`

- [ ] **Step 3: Implement useTransactionFilter**

Create `app/composables/useTransactionFilter.ts`:

```typescript
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
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/unit/useTransactionFilter.test.ts
```

Expected: All 6 tests pass. (Note: `useState` from `#app` is available in vitest via `@nuxt/test-utils` environment configured in vitest.config.ts.)

- [ ] **Step 5: Commit**

```bash
git add app/composables/useTransactionFilter.ts tests/unit/useTransactionFilter.test.ts
git commit -m "feat(m2): add useTransactionFilter composable with month expansion and matchesFilter"
```

---

## Task 3: Server — NL filter extraction in chat.post.ts

**Files:**
- Modify: `server/api/chat.post.ts`

This task adds filter event extraction to the existing chat endpoint. When `isFilterIntent` is true, we call `generateObject` with a Zod schema to extract structured filter parameters from the user's message, then emit a `filterEvent` metadata chunk.

- [ ] **Step 1: Add the Zod filter schema and extraction logic**

Open `server/api/chat.post.ts`. The current top of the file imports `streamText`, `StreamData`, `gateway`, `prisma`, `enforceRateLimit`, `detectChatIntent`, `parseExpenseInline`, and `z`.

Make these targeted changes:

**After the existing `import { z } from 'zod'` line, add:**
```typescript
import { generateObject } from 'ai'
```

**Add this schema and function before `export default defineEventHandler`:**

```typescript
const filterSchema = z.object({
  merchant: z.string().optional().describe('Nome do estabelecimento/loja, em minúsculas'),
  category: z.string().optional().describe('Nome da categoria de gastos'),
  minAmount: z.number().optional().describe('Valor mínimo em reais'),
  maxAmount: z.number().optional().describe('Valor máximo em reais'),
  month: z.string().optional().describe('Mês no formato YYYY-MM, ex: 2025-03'),
  installmentOnly: z.boolean().optional().describe('Somente transações parceladas'),
})

async function extractFilterParams(message: string): Promise<z.infer<typeof filterSchema> | null> {
  try {
    const today = new Date()
    const { object } = await generateObject({
      model: gateway('gpt-4o-mini'),
      schema: filterSchema,
      prompt: `Hoje é ${today.toISOString().slice(0, 10)}. Extraia os parâmetros de filtro da seguinte mensagem do usuário em português brasileiro. Retorne apenas os campos relevantes presentes na mensagem.\n\nMensagem: "${message}"`,
    })
    const hasAnyParam = Object.values(object).some(v => v !== undefined)
    return hasAnyParam ? object : null
  } catch {
    return null
  }
}
```

**Inside `defineEventHandler`, after the `intent` variable declaration, add filter extraction before the `StreamData` instantiation:**

The existing code has:
```typescript
const intent = detectChatIntent(lastMessage)
```

After that line, add:
```typescript
const filterParams = intent.isFilterIntent
  ? await extractFilterParams(lastMessage)
  : null
```

**Then after the existing `if (intent.isExpenseAdd)` block, add:**
```typescript
  if (filterParams) {
    data.append({ filterEvent: { type: 'filter:apply', filters: filterParams } })
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "chat\.post|filter" | head -10
```

Expected: No errors related to `chat.post.ts` or filter.

- [ ] **Step 3: Commit**

```bash
git add server/api/chat.post.ts
git commit -m "feat(m2): extract NL filter params with generateObject and emit filterEvent"
```

---

## Task 4: Handle filterEvent in useChat.ts + openWithAssistantMessage

**Files:**
- Modify: `app/composables/useChat.ts`

Two changes in this task:
1. When the stream emits a `filterEvent`, call `useTransactionFilter().applyFilter()`
2. Add `openWithAssistantMessage(message)` so `ProactiveAdvisor` can seed Du's first line

- [ ] **Step 1: Add useTransactionFilter import and handle filterEvent**

Open `app/composables/useChat.ts`.

**At the top, add this import after the existing imports:**
```typescript
import { useTransactionFilter } from './useTransactionFilter'
```

**Inside the `send()` function, find the section that handles `parsed.data`:**
```typescript
          if (parsed.data?.parsedExpense) {
```

After the closing `}` of that block (still inside the `for (const line of lines)` loop), add:
```typescript
          if (parsed.data?.filterEvent) {
            useTransactionFilter().applyFilter(parsed.data.filterEvent)
          }
```

**Add `openWithAssistantMessage` function after the existing `open()` function:**
```typescript
  function openWithAssistantMessage(content: string) {
    state.value.isOpen = true
    state.value.pendingInput = ''
    const assistantMsg: ChatMessage = { id: nanoid(), role: 'assistant', content }
    state.value.thread = [...state.value.thread, assistantMsg]
  }
```

**Add it to the return object:**
```typescript
    openWithAssistantMessage,
```

- [ ] **Step 2: Run unit tests**

```bash
npx vitest run tests/unit/useChat.test.ts
```

Expected: All existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/composables/useChat.ts
git commit -m "feat(m2): handle filterEvent in useChat, add openWithAssistantMessage"
```

---

## Task 5: AiHintBadge component

**Files:**
- Create: `app/components/chat/AiHintBadge.vue`

- [ ] **Step 1: Create AiHintBadge**

Create `app/components/chat/AiHintBadge.vue`:

```vue
<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const props = defineProps<{
  question: string
  label?: string
}>()

const chat = useChat()

function ask() {
  chat.open({ preloadedMessage: props.question })
}
</script>

<template>
  <button
    type="button"
    class="
      inline-flex items-center gap-1 rounded-full
      bg-[hsl(168_64%_70%_/_0.15)] hover:bg-[hsl(168_64%_70%_/_0.25)]
      border border-[hsl(168_64%_70%_/_0.3)]
      px-2 py-0.5 text-[11px] font-medium
      text-[hsl(168_64%_45%)] leading-none
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(168_64%_70%_/_0.5)]
      select-none
    "
    :aria-label="`Perguntar ao Du: ${question}`"
    @click.stop="ask"
  >
    <span aria-hidden="true">✦</span>
    <span>{{ label ?? 'perguntar' }}</span>
  </button>
</template>
```

- [ ] **Step 2: Verify the component renders by checking no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | grep AiHintBadge | head -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/chat/AiHintBadge.vue
git commit -m "feat(m2): add AiHintBadge sparkle pill component"
```

---

## Task 6: ProactiveAdvisor CTA

**Files:**
- Modify: `app/components/dashboard/ProactiveAdvisor.vue`

The spec says tapping the CTA opens chat with the advisor's message as **Du's opening line** — an assistant message already in the thread (Du speaks first, user responds). This uses `openWithAssistantMessage()` from Task 4.

- [ ] **Step 1: Add openWithAssistantMessage import and handler**

Open `app/components/dashboard/ProactiveAdvisor.vue`.

**In the `<script setup>` block, add after the existing imports:**
```typescript
import { useChat } from '@/composables/useChat'
const chat = useChat()
```

**Replace the existing `handleAction` function:**
```typescript
function handleAction() {
  handleDismiss()
}
```

**With:**
```typescript
function handleAction() {
  handleDismiss()
}

function askDu() {
  const msg = advisor.currentMessage.value?.message
  if (!msg) return
  handleDismiss()
  chat.openWithAssistantMessage(msg)
}
```

- [ ] **Step 2: Add the CTA button in the template**

In `<template>`, find the existing action button block:
```html
            <!-- Action button (if provided) -->
            <div v-if="advisor.currentMessage.value?.action" class="mt-3 pl-11">
              <Button
                variant="secondary"
                size="sm"
                class="h-auto min-h-7 py-1 px-3 text-xs whitespace-normal text-left justify-start"
                @click="handleAction"
              >
                {{ advisor.currentMessage.value.action.text }}
              </Button>
            </div>
```

Replace it with:
```html
            <!-- Action + Du CTA buttons -->
            <div class="mt-3 pl-11 flex flex-wrap gap-2">
              <Button
                v-if="advisor.currentMessage.value?.action"
                variant="secondary"
                size="sm"
                class="h-auto min-h-7 py-1 px-3 text-xs whitespace-normal text-left justify-start"
                @click="handleAction"
              >
                {{ advisor.currentMessage.value.action.text }}
              </Button>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded-full bg-[hsl(168_64%_70%_/_0.15)] hover:bg-[hsl(168_64%_70%_/_0.25)] border border-[hsl(168_64%_70%_/_0.3)] px-3 py-1 text-xs font-medium text-[hsl(168_64%_45%)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(168_64%_70%_/_0.5)]"
                @click="askDu"
              >
                ✦ Perguntar ao Du →
              </button>
            </div>
```

- [ ] **Step 3: Run existing tests**

```bash
npx vitest run tests/unit/
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add app/components/dashboard/ProactiveAdvisor.vue
git commit -m "feat(m2): add ✦ Perguntar ao Du CTA to ProactiveAdvisor toast"
```

---

## Task 7: TransactionContextMenu component

**Files:**
- Create: `app/components/transaction/TransactionContextMenu.vue`

The menu appears at the cursor/touch position. It floats as a small card with three actions.

- [ ] **Step 1: Create TransactionContextMenu**

Create `app/components/transaction/TransactionContextMenu.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { useChat } from '@/composables/useChat'

const props = defineProps<{
  x: number
  y: number
  transaction: {
    id: string
    description: string
    amount: number
    purchaseDate: string
    category: string
    installmentNumber: number
    totalInstallments: number
  }
}>()

const emit = defineEmits<{
  close: []
  edit: [id: string]
  delete: [id: string]
}>()

const chat = useChat()

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function askDu() {
  const { description, amount, purchaseDate, category, installmentNumber, totalInstallments } = props.transaction
  const installmentNote = totalInstallments > 1
    ? ` (parcela ${installmentNumber}/${totalInstallments})`
    : ''
  const question = `Fale sobre essa transação: ${description}${installmentNote} — ${formatCurrency(amount)} em ${purchaseDate}. Categoria: ${category}.`
  emit('close')
  chat.open({ preloadedMessage: question })
}

function handleEdit() {
  emit('edit', props.transaction.id)
  emit('close')
}

function handleDelete() {
  emit('delete', props.transaction.id)
  emit('close')
}

function handleClickOutside(e: MouseEvent) {
  emit('close')
}

onMounted(() => {
  // Use a microtask delay so the click that opened us doesn't immediately close us
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside, { once: true })
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Clamp position to viewport
const menuRef = ref<HTMLElement | null>(null)
const clampedX = ref(props.x)
const clampedY = ref(props.y)

onMounted(() => {
  if (!menuRef.value) return
  const rect = menuRef.value.getBoundingClientRect()
  if (props.x + rect.width > window.innerWidth - 8) {
    clampedX.value = window.innerWidth - rect.width - 8
  }
  if (props.y + rect.height > window.innerHeight - 8) {
    clampedY.value = props.y - rect.height
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      class="fixed z-[100] min-w-[200px] rounded-xl border border-border bg-popover shadow-lg overflow-hidden py-1"
      :style="{ top: `${clampedY}px`, left: `${clampedX}px` }"
      role="menu"
      @click.stop
    >
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[hsl(168_64%_45%)] hover:bg-muted transition-colors"
        @click="askDu"
      >
        <span class="text-base leading-none" aria-hidden="true">✦</span>
        Perguntar ao Du sobre isso
      </button>
      <div class="mx-3 border-t border-border/50" />
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
        @click="handleEdit"
      >
        <Pencil class="w-3.5 h-3.5 text-muted-foreground" />
        Editar
      </button>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
        @click="handleDelete"
      >
        <Trash2 class="w-3.5 h-3.5" />
        Excluir
      </button>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep TransactionContextMenu | head -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/transaction/TransactionContextMenu.vue
git commit -m "feat(m2): add TransactionContextMenu with Du, edit, delete actions"
```

---

## Task 8: Wire everything — badges, context menu, filter chip

**Files:**
- Modify: `app/components/transaction/TransactionList.vue`
- Modify: `app/components/dashboard/DuScoreCard.vue`
- Modify: `app/components/dashboard/SpendingPaceChart.vue`
- Modify: `app/components/dashboard/TrendingBudgetsCard.vue`
- Modify: `app/components/dashboard/UpcomingBillsCard.vue`
- Modify: `app/components/dashboard/FreeToSpendCard.vue`
- Modify: `app/components/dashboard/SummaryCards.vue`

This is the largest task. Do it in sub-steps.

### Sub-step A: Update TransactionList.vue

- [ ] **Step 1: Read the full TransactionList.vue first**

Read `app/components/transaction/TransactionList.vue` to understand the current template structure before editing.

- [ ] **Step 2: Add context menu + filter to TransactionList.vue script section**

In the `<script setup>` block:

**Add imports at the top (after existing imports):**
```typescript
import TransactionContextMenu from '@/components/transaction/TransactionContextMenu.vue'
import { useTransactionFilter } from '@/composables/useTransactionFilter'
import { X } from 'lucide-vue-next'
```

**After the existing composables/data, add:**
```typescript
const filter = useTransactionFilter()

// Context menu state
const contextMenu = ref<{
  x: number; y: number
  transaction: {
    id: string; description: string; amount: number
    purchaseDate: string; category: string
    installmentNumber: number; totalInstallments: number
  }
} | null>(null)

let longPressTimer: ReturnType<typeof setTimeout> | null = null

function openContextMenu(e: MouseEvent | Touch, tx: TransactionWithDate) {
  const clientX = 'clientX' in e ? e.clientX : e.clientX
  const clientY = 'clientY' in e ? e.clientY : e.clientY
  contextMenu.value = {
    x: clientX,
    y: clientY,
    transaction: {
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      purchaseDate: tx.purchaseDate,
      category: tx.category,
      installmentNumber: tx.installmentNumber,
      totalInstallments: tx.totalInstallments,
    },
  }
}

function onRowContextMenu(e: MouseEvent, tx: TransactionWithDate) {
  e.preventDefault()
  openContextMenu(e, tx)
}

function onRowTouchStart(e: TouchEvent, tx: TransactionWithDate) {
  const touch = e.touches[0]!
  longPressTimer = setTimeout(() => {
    openContextMenu(touch, tx)
  }, 500)
}

function onRowTouchEnd() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onRowTouchMove() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}
```

**Update `allTransactions` to apply filter:**

Find the existing `allTransactions` computed:
```typescript
const allTransactions = computed<TransactionWithDate[]>(() => {
  const flattened: TransactionWithDate[] = []
  Object.entries(props.transactions).forEach(([date, items]) => {
    items.forEach(item => {
      flattened.push({ ...item, purchaseDate: date })
    })
  })

  return flattened.sort((a, b) => {
```

Replace with:
```typescript
const allTransactions = computed<TransactionWithDate[]>(() => {
  const flattened: TransactionWithDate[] = []
  Object.entries(props.transactions).forEach(([date, items]) => {
    items.forEach(item => {
      flattened.push({ ...item, purchaseDate: date })
    })
  })

  const filtered = filter.activeFilter.value
    ? flattened.filter(tx => filter.matchesFilter({
        description: tx.description,
        amount: tx.amount,
        purchaseDate: tx.purchaseDate,
        category: tx.category,
      }))
    : flattened

  return filtered.sort((a, b) => {
```

(keep the rest of the sort function as-is, just change `flattened.sort` → `filtered.sort`)

- [ ] **Step 3: Add filter chip + context menu to TransactionList.vue template**

In the `<template>` section, find the outermost container div (the one wrapping everything). Add the filter chip as the very first child, before the existing table:

```html
      <!-- Du filter chip -->
      <div v-if="filter.activeFilter.value" class="mb-3 flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-[hsl(168_64%_70%_/_0.15)] border border-[hsl(168_64%_70%_/_0.3)] px-3 py-1 text-xs font-medium text-[hsl(168_64%_45%)]">
          <span aria-hidden="true">✦</span>
          Filtro aplicado pelo Du
        </span>
        <button
          type="button"
          class="flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          aria-label="Remover filtro do Du"
          @click="filter.clearFilter()"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
```

Find each `<TableRow>` for a transaction (there will be one in the desktop table). Add event handlers to it:

```html
<TableRow
  ...existing props...
  class="cursor-pointer"
  @contextmenu="onRowContextMenu($event, tx)"
  @touchstart.passive="onRowTouchStart($event, tx)"
  @touchend="onRowTouchEnd"
  @touchmove.passive="onRowTouchMove"
>
```

At the very end of the template (before the final closing tag), add:

```html
      <TransactionContextMenu
        v-if="contextMenu"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :transaction="contextMenu.transaction"
        @close="contextMenu = null"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
```

Also update `defineEmits` to pass through `edit` and `delete` if not already:
```typescript
defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/unit/
```

Expected: All pass.

- [ ] **Step 5: Commit TransactionList changes**

```bash
git add app/components/transaction/TransactionList.vue
git commit -m "feat(m2): add context menu and filter chip to TransactionList"
```

### Sub-step B: Add AiHintBadge to 5 dashboard cards

For each of the 5 cards below, the pattern is the same:
1. Import `AiHintBadge`
2. Wrap the card's root element in `relative`
3. Add `<AiHintBadge ... class="absolute top-3 right-3" />` with a contextual question

- [ ] **Step 6: DuScoreCard.vue**

Read the full `app/components/dashboard/DuScoreCard.vue`.

In `<script setup>`, add:
```typescript
import AiHintBadge from '@/components/chat/AiHintBadge.vue'
```

In the template, find the root `<div>` of the card and add `relative` class if not present. Inside it, near the top, add:
```html
<AiHintBadge
  question="Como posso melhorar meu DuScore?"
  class="absolute top-3 right-3"
/>
```

- [ ] **Step 7: SpendingPaceChart.vue**

Read the full `app/components/dashboard/SpendingPaceChart.vue`.

Import + add badge:
```html
<AiHintBadge
  question="Meu ritmo de gastos esse mês está bom?"
  class="absolute top-3 right-3"
/>
```

- [ ] **Step 8: TrendingBudgetsCard.vue**

Read the full `app/components/dashboard/TrendingBudgetsCard.vue`.

Import + add badge:
```html
<AiHintBadge
  question="Quais categorias estão mais comprometidas no meu orçamento?"
  class="absolute top-3 right-3"
/>
```

- [ ] **Step 9: UpcomingBillsCard.vue**

Read the full `app/components/dashboard/UpcomingBillsCard.vue`.

Import + add badge:
```html
<AiHintBadge
  question="Consigo pagar todas as contas que vencem essa semana sem comprometer o orçamento?"
  class="absolute top-3 right-3"
/>
```

- [ ] **Step 10: FreeToSpendCard.vue**

Read the full `app/components/dashboard/FreeToSpendCard.vue`.

Import + add badge:
```html
<AiHintBadge
  question="Como posso aproveitar melhor o dinheiro disponível para gastar?"
  class="absolute top-3 right-3"
/>
```

### Sub-step C: SummaryCards — badge on category mini-cards

- [ ] **Step 11: Read SummaryCards.vue**

Read the full `app/components/dashboard/SummaryCards.vue` to find the category mini-card structure.

- [ ] **Step 12: Add badge to each category mini-card in SummaryCards.vue**

In `<script setup>`, import:
```typescript
import AiHintBadge from '@/components/chat/AiHintBadge.vue'
```

Find the template element that renders each category card (likely a `v-for` loop over categories). Wrap the card element in a `relative` container if not already, and add:

```html
<AiHintBadge
  :question="`Por que gastei tanto em ${category.name}?`"
  class="absolute top-2 right-2"
/>
```

(Use the actual variable name for `category.name` from the existing loop.)

- [ ] **Step 13: Run full test suite**

```bash
npx vitest run tests/unit/
```

Expected: All pass.

- [ ] **Step 14: Final commit**

```bash
git add app/components/dashboard/DuScoreCard.vue app/components/dashboard/SpendingPaceChart.vue app/components/dashboard/TrendingBudgetsCard.vue app/components/dashboard/UpcomingBillsCard.vue app/components/dashboard/FreeToSpendCard.vue app/components/dashboard/SummaryCards.vue
git commit -m "feat(m2): add AiHintBadge to 6 dashboard widgets"
```

---

## Acceptance checklist

After all tasks are complete, verify manually in the browser:

- [ ] ✦ sparkle badge visible on DuScoreCard, SpendingPaceChart, TrendingBudgetsCard, UpcomingBillsCard, FreeToSpendCard, and category cards in SummaryCards
- [ ] Clicking any badge opens the chat panel with the pre-loaded question in the input
- [ ] ProactiveAdvisor toast has "✦ Perguntar ao Du →" CTA; tapping it opens chat with the advisor message as Du's first line
- [ ] Right-clicking a transaction row shows the 3-item context menu
- [ ] Tapping and holding a transaction row for 500ms shows the context menu on mobile (or in dev tools mobile emulation)
- [ ] Clicking "Perguntar ao Du" in context menu opens chat with that transaction's details pre-loaded
- [ ] Typing "mostra gastos com [merchant]" in chat applies a filter — matching transactions remain, others hidden
- [ ] "Filtro aplicado pelo Du" chip appears above transaction list; ✕ clears it and restores all transactions
