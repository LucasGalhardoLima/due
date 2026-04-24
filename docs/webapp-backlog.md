# Du Webapp — Backlog

Snapshot: 2026-04-23. Pausing webapp work to focus on iOS app.

---

## Open PRs (merge when ready)

| PR | Title | Notes |
|---|---|---|
| [#60](https://github.com/LucasGalhardoLima/due/pull/60) | Du Chat M2 — Context Everywhere | AI hint badges, transaction context menu, NL filtering, ProactiveAdvisor CTA |
| [#59](https://github.com/LucasGalhardoLima/due/pull/59) | Itau fatura PDF import pipeline | Parser, AI cleanup, CLI script, batch API installments |
| [#56](https://github.com/LucasGalhardoLima/due/pull/56) | LUM-238: Prompt injection sanitization | Security fix |
| [#55](https://github.com/LucasGalhardoLima/due/pull/55) | LUM-222: Stripe webhook TOCTOU | Security fix |

---

## Du Chat FAB — M3: Coach Layer

**Spec:** `docs/superpowers/specs/2026-04-21-du-chat-fab-design.md` (M3 section)

### What it is
Persistent chat history, financial goal tracking, financial calendar, installment optimizer — all surfaced through the chat interface.

### New DB models (no schema changes in M1/M2 — M3 is the first migration)

```prisma
model ChatSession {
  id        String        @id @default(cuid())
  userId    String
  title     String?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]
  user      User          @relation(fields: [userId], references: [id])
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  role      String      // "user" | "assistant"
  content   String
  metadata  Json?       // IDs and deltas only — no raw financial data
  createdAt DateTime    @default(now())
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model UserGoal {
  id          String    @id @default(cuid())
  userId      String
  category    String?
  description String    // "Gastar menos de R$600 em restaurantes"
  targetValue Decimal?
  period      String    // "monthly" | "weekly"
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String
  keys      Json
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

### New files

| File | Responsibility |
|---|---|
| `app/composables/useChatHistory.ts` | Load/delete sessions. Pagination. |
| `app/composables/useCoachGoals.ts` | CRUD for user goals. Goal proximity checks. |
| `app/composables/useWebPush.ts` | Request permission, store subscription, trigger notification |
| `app/components/chat/ChatSessionList.vue` | History sidebar: sessions grouped by day, deletable |

### Modified files

| File | Change |
|---|---|
| `server/api/chat.post.ts` | Accept `sessionId`, load history into context, store messages, inject active goals |
| `app/layouts/default.vue` | Wire history panel and session management |
| `app/pages/settings.vue` | Add "Dados e privacidade" section: delete history, retention policy copy |
| `app/pages/metas.vue` | New page: view/edit goals (or surface from chat) |

### New API endpoints

| Endpoint | Description |
|---|---|
| `GET /api/chat/sessions` | List sessions (paginated) |
| `GET /api/chat/sessions/:id/messages` | Load messages for a session |
| `DELETE /api/chat/sessions/:id` | Delete a session |
| `POST /api/chat/goals` | Create/update a user goal |
| `GET /api/chat/goals` | List active goals |
| `POST /api/notifications/subscribe` | Store web push subscription |
| `POST /api/notifications/send` | Internal: trigger push on task completion |

### Chat capabilities added in M3

- **Financial Calendar** — "O que vem pela frente essa semana?" returns a structured card with upcoming bills, fatura closing dates, installment payments, salary dates
- **Installment Optimizer** — "Qual parcelamento devo quitar primeiro?" returns ranked list by effective rate with "Simular quitação" action
- **Goal creation** — "quero gastar menos de R$600 em restaurantes" → creates `UserGoal`; Du references goals in greetings and analysis

### Acceptance criteria

- [ ] Chat history persists across browser sessions; sessions grouped by day
- [ ] Individual session and full history deletion work from Settings → Dados e privacidade
- [ ] Retention policy copy shown at first session open
- [ ] Saying "quero gastar menos de R$600 em restaurantes" creates a UserGoal
- [ ] Opening greeting references at-risk goals
- [ ] "O que vem pela frente essa semana?" returns financial calendar card
- [ ] "Qual parcelamento devo quitar primeiro?" returns ranked installment list with "Simular quitação"
- [ ] Web push fires on task completion when permission granted

---

## Du Chat FAB — Sunset components

After M3 ships and chat reaches feature parity with the legacy AI surfaces:

| Component | Replacement | Notes |
|---|---|---|
| `app/components/dashboard/AIInsights.vue` | Chat suggestions | Remove button and modal |
| `app/components/dashboard/AIInsightsModal.vue` | Chat rich response cards | 20KB modal — big win |
| `app/components/dashboard/AIMobileDrawer.vue` | `ChatBottomSheet.vue` | Already functionally replaced |

---

## Fatura Import — In-App UI

**Spec:** `docs/superpowers/plans/2026-03-13-fatura-pdf-import.md` (parse-fatura API was deferred)

The CLI script (`scripts/import-fatura.ts`) works for dev use, but the in-app flow (upload PDF → preview → confirm import) was explicitly deferred.

### What's needed

| File | Responsibility |
|---|---|
| `server/api/import/parse-fatura.post.ts` | Accept PDF upload, extract text, run parser + AI cleanup, return preview |
| `app/pages/import.vue` | Upload UI, preview table, confirm/cancel import flow |

### Flow
1. User uploads PDF (or multiple)
2. Server parses → returns `{ transactions[], skippedInstallments[], stats }` preview
3. User reviews, edits categories, confirms
4. POST to `/api/transactions/batch` (already supports `installmentsCount`)

### Tier gate
`pdfImportsPerMonth`: free=1, plus/pro=unlimited (already in `tier-config.ts`)

---

## Fatura Import — AI-Powered Historical Grouping

**Spec:** `docs/superpowers/specs/2026-03-16-ai-grouping-fatura-import-design.md`

For users importing multiple months of historical fatura data where installment parents predate the earliest available PDF.

### Problem
The current CLI handles single faturas cleanly. Across multiple faturas:
- Ongoing installments (e.g., 11/12) whose `01/XX` parent predates the earliest PDF become orphans
- Description drift across months (`EC *LGELECTRONICS` vs `EC*LG ELECTRONICS`) breaks grouping
- AI cleanup quality is better with grouped context

### Pipeline
```
PDFs → [1. Parse each] → [2. AI Group across all] → [3. Synthesize parents] → [4. Import + Verify]
```

**Stage 2 (AI Group):** Send all parsed lines across all faturas to Claude Haiku in one call. AI groups lines by description similarity + same amount + same installmentsTotal + sequential due dates. Returns groups with clean descriptions and category suggestions.

**Stage 3 (Synthesize):**
- Groups with `01/XX` → standard parent reconstruction
- Orphan groups (no `01/XX`) → back-calculate purchase date from earliest installment
- Single lines → one transaction, one installment

**Stage 4 (Verify):** Monthly installment sums must match PDF totals; every lineIndex appears exactly once.

**Cost:** ~$0.10–0.30 per bulk import run (Claude Haiku). One-time onboarding cost.

### Files needed
| File | Responsibility |
|---|---|
| `scripts/import-fatura-bulk.ts` | CLI: bulk historical import with AI grouping |
| `server/utils/fatura/ai-group.ts` | AI grouping logic (cross-fatura) |
| `server/utils/fatura/synthesize.ts` | Parent reconstruction (including orphans) |

---

## Transaction Delete

The context menu in M2 shows only "Perguntar ao Du" and "Editar" because no server-side delete handler existed. The "Excluir" menu item was removed rather than leaving a no-op.

### What's needed
- `DELETE /api/transactions/:id` endpoint (with ownership check)
- Re-add "Excluir" to `TransactionContextMenu.vue`
- Wire `@delete` on `<TransactionList>` in `dashboard.vue` with confirmation dialog

---

## Minor gaps / polish

- `useTransactionFilter.applyFilter` does not validate `YYYY-MM` shape of `month` field — add a regex guard
- `'filter:clear'` branch in `useTransactionFilter` is dead (server never emits it) — either wire a clear-filter chat command or remove the branch
- Mobile view in `TransactionList` (the grouped accordion) does not apply the Du filter — only the desktop table is filtered. Fix: apply `allTransactions` computed to the mobile section too
- `isFilterIntent` regex won't match "por favor, mostra meus gastos" (leading polite phrase) — consider adding a non-anchored fallback
