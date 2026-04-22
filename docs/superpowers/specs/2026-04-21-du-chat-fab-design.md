# Du Chat FAB — Design Spec

**Date:** 2026-04-21  
**Status:** Approved for implementation  
**Branch:** lum-187/quick-add-expense-via-chat-fab

---

## Overview

Replace the two existing FABs (add expense `+` and AI sparkles `✦`) with a single unified **Du Chat FAB** — a conversational interface that consolidates all AI features into one persistent chat panel. The goal is to make Du feel like a real financial coach that the user has an ongoing relationship with, not a collection of isolated AI tools.

---

## Milestone Plan

| Milestone | Scope | Gate |
|---|---|---|
| **M1 — Core FAB** | FAB + panel shell + streaming chat + expense add via NL | Users can have a basic conversation and add expenses |
| **M2 — Context everywhere** | AI hint badges, toast CTA, transaction context menu, NL filtering | Every data point is a conversation entry point |
| **M3 — Coach layer** | Persistent history, goal tracking, financial calendar, installment optimizer, web push | Du remembers and proactively coaches |

Each milestone ships independently. M2 requires M1 in production; M3 requires M2.

---

## Core Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Layout | Slide-in panel (right, desktop) / bottom sheet (mobile) | Preserves spatial context — user sees data while chatting |
| Chat history | Persistent, session-grouped, deletable | Memory is the product for a coach |
| Write scope | Add expenses + targeted edits/deletes | Bulk ops need dedicated confirmation UX before enabling |
| AI hints | Subtle sparkle on widgets + proactive toast CTA | Unobtrusive by default, assertive when Du detects issues |
| Notifications | Web push + in-app, prompt when task starts | Ask in context, fall back gracefully |
| FAB icon | ✦ (four-pointed star, mint) | Du's AI marker, distinct from the "du" wordmark |
| Panel header | 👋 bare emoji left of "Du" title | Warm, personal, no container chrome |
| Mobile | Full-screen bottom sheet | Same pattern as existing TransactionDrawer |

---

## Visual Identity

- **FAB:** 52×52px circle, `hsl(168 64% 70%)` (mint), ✦ symbol in `hsl(252 57% 14%)` (deep violet). Glow shadow on hover. Replaces both existing FABs.
- **Panel header:** `👋` bare emoji · **Du** (800 weight) · "Seu coach financeiro" subtitle · ✕ close
- **✦ symbol** is used consistently across: FAB, Du's message avatar, "Perguntar ao Du" CTAs in toasts. It becomes Du's AI identity marker across the entire product.
- **Design tokens:** Dark mode + Cyber Mint palette. Font: Geist Pixel Square (ui-monospace fallback). Radius: 1.25rem base.

---

## Panel Structure

### Opening state (before first message)

Shown every time the panel opens to a fresh session, or after the user clears history.

- **Contextual greeting:** "Oi, [name]! Estou vendo [current tab context]. O que posso fazer por você?"
- **Quick action chips:** 5 suggestions, contextual to the active tab:
  - **Cartão de Crédito tab:** Add expense, Por que minha fatura está alta?, Comparar com o mês passado, Análise profunda (6 meses), Projeção desta fatura
  - **Fluxo de Caixa tab:** Como está meu orçamento?, O que tenho livre para gastar?, Meta de economia, Análise de categorias, O que vem pela frente essa semana?
  - **Other pages** (e.g. /parcelamentos): suggestions specific to that page's data
- Tapping a chip populates it as a user message and triggers Du's response

### Active chat state

- **User messages:** right-aligned, violet (`hsl(252 44% 36%)`) background
- **Du messages:** left-aligned with ✦ avatar. Responses render as:
  - Short prose intro
  - **Rich response card** when data is involved (category bars, amounts, deltas, verdict text)
  - **Inline action buttons** inside the card (e.g. "Criar orçamento", "Ver transações") — execute actions without leaving chat
  - **Follow-up chips** below each response — 2–3 contextual next questions
- Typing indicator (animated dots) while Du is processing

### Long-running tasks

Triggered by: deep insights (6-month analysis), report generation, PDF import, future heavy operations.

1. Du shows typing indicator immediately
2. After ~1s, a **notification prompt card** appears:
   - Icon + title + description mentioning estimated time (~30s)
   - Animated indeterminate progress bar
   - **"🔔 Me avise quando terminar"** (requests web push permission, stores intent)
   - **"Aguardar aqui"** (stays in panel without notification)
   - Fine print: "Notificação do navegador, funciona mesmo com a aba minimizada"
3. On completion: web push fires (if granted) OR in-app notification bell increments
4. Tapping the notification reopens the panel with the result already loaded

---

## M1 — Core FAB

### In scope
- `ChatFab.vue` + `ChatPanel.vue` (desktop) + `ChatBottomSheet.vue` (mobile)
- `ChatThread.vue` + `ChatMessage.vue` + `ChatResponseCard.vue`
- `ChatSuggestions.vue` (opening state with contextual chips)
- `ChatNotificationPrompt.vue` (long-running task UX)
- `useChat.ts` composable (open/close state, send/receive, streaming)
- `useChatContext.ts` (derive chips from current route)
- `POST /api/chat` — updated (see API section below)
- Remove `GlobalQuickAddFab.vue`
- Expense add via NL: Du parses the message using `/api/ai/parse-expense`, shows a confirmation card, and opens `TransactionDrawer` pre-filled on confirm

### Acceptance criteria (M1)
- [ ] ✦ FAB visible on all pages, replaces both previous FABs
- [ ] Clicking FAB opens slide-in panel (desktop) or bottom sheet (mobile)
- [ ] Opening state shows contextual greeting + 5 suggestion chips
- [ ] User can type a message and receive a streamed Du response
- [ ] Saying "gastei R$50 no Spoleto" triggers expense parse → confirmation card → opens pre-filled drawer
- [ ] Deep analysis (6-month) triggers typing + notification prompt card within ~1s
- [ ] All existing AI features remain reachable via chat (insights, advisor, parse-expense)

---

## M2 — Context Everywhere

### AI Hints in the UI

Two tiers, following the approved A+C pattern:

#### Tier A — Subtle sparkle badges
Small pill badges on widgets showing notable data. Visible on hover (desktop) or always visible (mobile).

```
[● perguntar]
```

- Placed top-right of mini-cards (category spending, DuScore, budget bars, etc.)
- Color: mint `hsl(168 64% 70%)`, muted background
- Clicking opens the chat panel with that widget's data pre-loaded as context (e.g. clicking the Restaurantes sparkle opens chat with "Por que gastei tanto em restaurantes?" pre-sent)
- **Placement targets:** category mini-cards on dashboard, DuScoreCard, SpendingPaceChart, TrendingBudgetsCard, UpcomingBillsCard, FreeToSpendCard

#### Tier C — Proactive toast evolution
The existing `ProactiveAdvisor.vue` toast keeps its behavior but gains a **"✦ Perguntar ao Du →"** CTA button at the bottom. Tapping it:
1. Opens the chat panel
2. Pre-sends the advisor message as Du's opening line (not just as context — Du speaks first)
3. Dismisses the toast

The toast still auto-dismisses on its existing timer if not tapped.

### Transaction Context Menu

Right-click (desktop) or long-press (mobile) on any transaction item in the list → a small popover appears:

```
[ ✦ Perguntar ao Du sobre isso ]
[ ✏  Editar ]
[ 🗑  Excluir ]
```

**Mobile note:** Long-press opens this popover; it does NOT conflict with scroll because the gesture requires ≥500ms hold before activating. Tap-and-hold-scroll is not a recognized mobile gesture — users scroll by swiping, not by long-pressing. The existing edit/delete actions in the transaction row (swipe-to-delete or tap-to-open drawer) remain unchanged; the context menu is an additive gesture layer.

Tapping "Perguntar ao Du" opens the chat panel with that specific transaction pre-loaded. Du knows the amount, merchant, date, category, and whether it's part of an installment.

### Natural Language View Filtering

When the user types a filtering intent in the chat (e.g. "mostra todos os gastos com Uber Eats em março" or "transações acima de R$200 esse mês"), Du:

1. Responds with a summary in the chat
2. **Also applies a filter to the transaction list** visible in the dashboard behind the panel
3. Shows a dismissible "Filtro aplicado pelo Du" chip above the transaction list with an ✕ to clear

**Filter event schema:**

```typescript
interface ChatFilterEvent {
  type: 'filter:apply' | 'filter:clear'
  filters: {
    merchant?: string          // "Uber Eats"
    category?: string          // category id
    minAmount?: number         // e.g. 200
    maxAmount?: number
    dateFrom?: string          // ISO date "2025-03-01"
    dateTo?: string            // ISO date "2025-03-31"
    month?: string             // shorthand "2025-03" → expands to dateFrom/dateTo
    installmentOnly?: boolean
  }
}
```

Du's response JSON includes a `filterEvent` field alongside the prose. The `useTransactionFilter` composable subscribes to these events via a Nuxt provide/inject channel and applies them to the existing transaction list state. Supported operators: exact match (merchant, category), range (amount, date), boolean flag (installmentOnly). Compound filters are additive (AND).

### In scope (M2)
- `AiHintBadge.vue` — reusable sparkle pill
- `TransactionContextMenu.vue`
- `useTransactionFilter.ts`
- Update `ProactiveAdvisor.vue` with CTA
- Update `POST /api/chat` to emit `filterEvent` in response

### Acceptance criteria (M2)
- [ ] ✦ sparkle badge visible on all 6 placement targets; clicking opens chat with pre-loaded context
- [ ] Proactive toast has "✦ Perguntar ao Du →" CTA; tapping opens chat with advisor message as Du's first line
- [ ] Right-click on any transaction (desktop) shows context menu with Du option
- [ ] Long-press ≥500ms on any transaction (mobile) shows context menu with Du option
- [ ] Typing "mostra gastos com [merchant]" applies merchant filter to visible transaction list
- [ ] Typing "transações acima de R$[n]" applies minAmount filter
- [ ] Typing "gastos em [month]" applies month filter
- [ ] "Filtro aplicado pelo Du" chip appears; ✕ clears all Du-applied filters

---

## M3 — Coach Layer

### Coach Memory + Goal Tracking

#### Persistent history
- Conversations grouped by day (like Claude.ai / ChatGPT)
- Accessible via a "Histórico" button in the panel header area
- Each session deletable individually; full history deletable in settings
- Stored server-side (new `ChatSession` + `ChatMessage` DB models)

**Data retention policy:** Chat history is retained for 12 months from the session's last activity. Users can delete individual sessions or all history from Settings → Dados e privacidade. Du responses that contain structured financial data (parsed transactions, goal updates, filter events) store that metadata in `ChatMessage.metadata` (JSON). Raw financial data is never duplicated — metadata stores IDs and deltas, not copied account data. Users are informed of retention policy at first chat session open.

#### Goal tracking
- When Du identifies or the user sets a financial goal through chat ("quero gastar menos de R$600 em restaurantes"), Du stores it as a `UserGoal`
- **Proactive reference:** Du mentions goals in relevant contexts:
  - In the opening greeting if a goal is at risk: "Você está a R$120 de atingir seu limite de restaurantes"
  - In the proactive toast when a goal is breached
  - As follow-up context in any spending analysis response
- Goals are viewable/editable in `/metas` page and via chat ("quais são minhas metas?")

### Financial Calendar

Accessible via chat: "O que vem pela frente essa semana?" or "Meu calendário financeiro de maio".

Du responds with a structured card showing:
- Upcoming bills (from `/api/dashboard/upcoming-bills`)
- Fatura closing dates with projected amounts
- Installment payment dates
- Salary/income expected dates (if set)
- Budget reset date

This surfaces existing API data through a conversational interface — no new backend work for the basic version.

### Installment Optimizer

Accessible via chat: "Qual parcelamento devo quitar primeiro?" or "Como economizo mais quitando parcelamentos?".

Du analyzes all active installments (from `/api/parcelamentos`) and returns a ranked recommendation:
- Ranked by effective interest rate (highest first)
- Shows potential savings for each if paid early
- Inline action button: "Simular quitação" (hooks into existing PurchaseSimulator logic)

### In scope (M3)
- `useChatHistory.ts`, `useCoachGoals.ts`, `useWebPush.ts`
- `ChatSessionList.vue` (history sidebar/drawer)
- New DB models: ChatSession, ChatMessage, UserGoal, PushSubscription
- New API endpoints: sessions CRUD, goals CRUD, push subscribe/send
- Update `POST /api/chat` to store messages and load goal context

### Acceptance criteria (M3)
- [ ] Chat history persists across browser sessions; sessions grouped by day
- [ ] Individual session and full history deletion work from Settings
- [ ] Saying "quero gastar menos de R$600 em restaurantes" creates a UserGoal
- [ ] Opening greeting references at-risk goals
- [ ] "O que vem pela frente essa semana?" returns financial calendar card
- [ ] "Qual parcelamento devo quitar primeiro?" returns ranked installment list with "Simular quitação"
- [ ] Web push permission prompt appears when deep analysis starts
- [ ] Web push notification fires on task completion (when permission granted)
- [ ] Retention policy copy shown at first session open; delete controls exist in Settings

---

## Components

### New
| Component | Milestone | Description |
|---|---|---|
| `ChatFab.vue` | M1 | The ✦ FAB button. Handles open/close state globally via composable. |
| `ChatPanel.vue` | M1 | Desktop slide-in panel. Contains header, thread, footer. |
| `ChatBottomSheet.vue` | M1 | Mobile full-screen bottom sheet (wraps same thread/footer). |
| `ChatThread.vue` | M1 | Scrollable message list. Renders user bubbles + Du messages. |
| `ChatMessage.vue` | M1 | Single Du message: prose + optional rich card + follow-up chips. |
| `ChatResponseCard.vue` | M1 | Rich structured card renderer (category bars, amounts, actions). |
| `ChatSuggestions.vue` | M1 | Opening state: greeting + suggestion chips. |
| `ChatNotificationPrompt.vue` | M1 | Long-running task prompt with web push request. |
| `AiHintBadge.vue` | M2 | Reusable sparkle pill badge for widget corners. |
| `TransactionContextMenu.vue` | M2 | Right-click / long-press popover on transaction items. |
| `ChatSessionList.vue` | M3 | History panel: sessions grouped by day, deletable. |

### Modified
| Component | Milestone | Change |
|---|---|---|
| `ProactiveAdvisor.vue` | M2 | Add "✦ Perguntar ao Du →" CTA that opens ChatPanel with context |
| `GlobalQuickAddFab.vue` | M1 | **Remove** — replaced by ChatFab |
| `TransactionDrawer.vue` | M1 | Keep for direct add/edit flows; ChatFab's add expense path routes here after parsing |

### Sunset (M2/M3, after chat reaches parity)
| Component | Replacement |
|---|---|
| `AIInsights.vue` + `AIInsightsModal.vue` | Chat suggestions + rich response cards |
| `AIMobileDrawer.vue` | ChatBottomSheet |

---

## Composables

| Composable | Milestone | Responsibility |
|---|---|---|
| `useChat.ts` | M1 | Global chat state: open/close, active session, thread messages, send/receive |
| `useChatContext.ts` | M1 | Derives contextual suggestions from current route + tab |
| `useTransactionFilter.ts` | M2 | Applies/clears filters emitted by Du's NL filtering |
| `useChatHistory.ts` | M3 | Load/delete sessions. Pagination. |
| `useCoachGoals.ts` | M3 | CRUD for user goals. Checks goal proximity for proactive hints. |
| `useWebPush.ts` | M3 | Request permission, store subscription, trigger notification |

---

## API

### `POST /api/chat` — Updated in M1

The existing endpoint accepts a message and streams a response. Changes required:

**M1 additions:**
- Accept `context` field: `{ route: string, tabContext: string, preloadedMessage?: string }` — used to inject current page state into the system prompt
- Detect expense-add intent in the message; if matched, call `/api/ai/parse-expense` internally and include a `parsedExpense` field in the streamed response metadata
- Detect long-running task intent (deep analysis keywords); return a `longRunning: true` flag early in the stream so the client can show the notification prompt immediately without waiting for the full response
- Response shape (streamed JSON chunks):
  ```typescript
  interface ChatStreamChunk {
    type: 'text' | 'card' | 'action' | 'metadata'
    content?: string           // for type: 'text'
    card?: ResponseCard        // for type: 'card'
    action?: ChatAction        // for type: 'action'
    metadata?: {               // for type: 'metadata'
      longRunning?: boolean
      parsedExpense?: ParsedExpense
      filterEvent?: ChatFilterEvent   // M2
      goalCreated?: UserGoal          // M3
    }
  }
  ```

**M2 additions:**
- Detect NL filter intent; include `filterEvent` in metadata chunk

**M3 additions:**
- Accept `sessionId` to load conversation history into context
- Store each message and response to `ChatMessage` table
- Load active `UserGoal` records for the user and inject into system prompt

### New endpoints (M3)
| Endpoint | Description |
|---|---|
| `GET /api/chat/sessions` | List conversation sessions (paginated) |
| `GET /api/chat/sessions/:id/messages` | Load messages for a session |
| `DELETE /api/chat/sessions/:id` | Delete a session |
| `POST /api/chat/goals` | Create/update a user goal from chat |
| `GET /api/chat/goals` | List active goals |
| `POST /api/notifications/subscribe` | Store web push subscription |
| `POST /api/notifications/send` | Internal: trigger push on task completion |

### Existing (unchanged)
`/api/ai/insights`, `/api/ai/deep-insights` (Claude Opus 4, ~30s), `/api/ai/parse-expense`, `/api/advisor/contextual`, `/api/advisor/analyze`

---

## Database

New models added in M3:

```prisma
model ChatSession {
  id        String        @id @default(cuid())
  userId    String
  title     String?       // auto-generated from first message
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]
  user      User          @relation(fields: [userId], references: [id])
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      String      // "user" | "assistant"
  content   String      // text content
  metadata  Json?       // rich card data, actions taken, filter applied — IDs and deltas only, no raw financial data
  createdAt DateTime    @default(now())
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model UserGoal {
  id          String    @id @default(cuid())
  userId      String
  category    String?   // linked category id if applicable
  description String    // "Gastar menos de R$600 em restaurantes"
  targetValue Decimal?
  period      String    // "monthly" | "weekly"
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
}

model PushSubscription {
  id           String   @id @default(cuid())
  userId       String
  endpoint     String
  keys         Json
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id])
}
```

M1 and M2 require no schema changes — they work entirely with existing models and the updated `/api/chat` endpoint.

---

## Rate Limits

The chat endpoint already has 20 req/60s. New considerations:
- Goal creation: no rate limit (low volume)
- NL filtering: piggybacks on the chat endpoint, no extra limit needed
- Push notifications: throttle to 1 per task completion per user

---

## Migration Plan

**M1 (this spec, first ship):** Ship the chat FAB alongside existing AI components. Both work in parallel. Users discover chat organically. `GlobalQuickAddFab` removed.

**M2 (fast follow):** AI hints and context menu everywhere. `ProactiveAdvisor` gains Du CTA. NL filtering wired up.

**M3 (coach layer):** Persistent history, goals, push, calendar, optimizer. Remove `AIInsightsModal`, `AIInsights` button, `AIMobileDrawer`.

---

## Success Criteria

### M1
- User can add an expense entirely through natural language in the chat panel
- User can ask "por que minha fatura está alta?" and receive a rich card response with inline actions
- Deep analysis (6-month) triggers the notification prompt; web push fires on completion (push wired in M1, subscription stored in M3)

### M2
- Proactive toast "✦ Perguntar ao Du" opens chat with the advisor insight pre-loaded as Du's opening message
- Right-click on any transaction shows the Du context menu (long-press on mobile, ≥500ms)
- Typing a filter intent in chat updates the visible transaction list

### M3
- Chat history persists across sessions and is browsable
- Du proactively references user goals in relevant contexts
- All existing AI features remain accessible via chat
- Users can view and delete their chat history from Settings
