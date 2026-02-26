# Tasks: Dashboard Tabbed Reorganization

**Input**: Design documents from `/specs/002-dashboard-tabs/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — manual visual testing per quickstart.md.

**Organization**: Tasks are grouped by user story. All tasks modify `app/pages/dashboard.vue` (single-file refactor), so parallelism is limited. Tasks are sequential within the file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add tab state and tab bar UI to the dashboard

- [x] T001 Add `activeTab` ref typed as `'card' | 'cashflow'` defaulting to `'card'` in the script section of `app/pages/dashboard.vue`
- [x] T002 Add tab bar HTML between the desktop PageHeader and content sections in `app/pages/dashboard.vue` — copy the exact pill-style segmented control pattern from `app/pages/audit/index.vue` (lines 352-377) with two buttons: "Cartao de Credito" and "Fluxo de Caixa"
- [x] T003 Add the same tab bar in the mobile header section (below the mobile controls row, above content) in `app/pages/dashboard.vue`

**Checkpoint**: Tab bar renders on both desktop and mobile. Clicking tabs updates `activeTab`. No content changes yet.

---

## Phase 2: User Story 1 — Credit Card Tab (Priority: P1)

**Goal**: All credit card widgets are grouped under the "Cartao de Credito" tab. Card selector is only visible on this tab.

**Independent Test**: Open Dashboard, verify credit card widgets (SummaryCards, crisis alerts, transactions, AI Insights, purchase simulator, future projection) appear. Switch to "Fluxo de Caixa" tab — none of these widgets are visible.

### Implementation for User Story 1

- [x] T004 [US1] Wrap the crisis alerts section (`<div v-if="crisisAlerts ...">`) with an outer `<div v-show="activeTab === 'card'">` in `app/pages/dashboard.vue`
- [x] T005 [US1] Wrap the SummaryCards section and its parent `<div class="space-y-5">` with `v-show="activeTab === 'card'"` in `app/pages/dashboard.vue` — ensure both crisis alerts and SummaryCards are inside the same v-show wrapper
- [x] T006 [US1] Wrap the main content grid (`grid-cols-[1fr_380px]`) containing TransactionList, AIInsights, PurchaseSimulator, SavingsGoalsWidget (sidebar), and FutureProjection with `v-show="activeTab === 'card'"` in `app/pages/dashboard.vue`
- [x] T007 [US1] Add `v-show="activeTab === 'card'"` to the desktop card selector `<Select>` wrapper in the PageHeader actions slot of `app/pages/dashboard.vue`
- [x] T008 [US1] Add `v-show="activeTab === 'card'"` to the mobile card selector `<Select>` in the mobile controls row of `app/pages/dashboard.vue`

**Checkpoint**: Credit Card tab shows all card-related widgets. Switching to Fluxo de Caixa hides them. Card selector hidden on Cash Flow tab.

---

## Phase 3: User Story 2 — Cash Flow Tab (Priority: P1)

**Goal**: All budget/cash flow widgets are grouped under the "Fluxo de Caixa" tab with a consolidated empty state when no budget data exists.

**Independent Test**: Switch to "Fluxo de Caixa" tab, verify FreeToSpendCard, DuScoreCard, SpendingPaceChart, NetThisMonthCard, TrendingBudgetsCard, UpcomingBillsCard, and SavingsGoalsWidget appear. Switch to "Cartao de Credito" — none of these are visible.

### Implementation for User Story 2

- [x] T009 [US2] Wrap the FreeToSpendCard section with `v-show="activeTab === 'cashflow'"` in `app/pages/dashboard.vue` — remove its existing `v-if` guard from the outer wrapper (keep the v-if for data checks inside a new inner condition)
- [x] T010 [US2] Wrap the budget widgets grid (DuScoreCard + SpendingPaceChart + NetThisMonthCard, the 3-col grid) with `v-show="activeTab === 'cashflow'"` in `app/pages/dashboard.vue`
- [x] T011 [US2] Wrap the secondary widgets grid (TrendingBudgetsCard + UpcomingBillsCard, the 2-col grid) with `v-show="activeTab === 'cashflow'"` in `app/pages/dashboard.vue`
- [x] T012 [US2] Move SavingsGoalsWidget from the credit card sidebar into the cash flow section (after UpcomingBillsCard grid) with `v-show="activeTab === 'cashflow'"` in `app/pages/dashboard.vue`
- [x] T013 [US2] Add consolidated empty state for when no budget data exists: when `activeTab === 'cashflow'` and `(!budgetSummary || budgetSummary.totalIncome === 0)`, show `<EmptyState>` with icon `Wallet`, title "Configure seu orcamento", description "Adicione sua renda e metas para acompanhar seu fluxo de caixa", action-label "Configurar Orcamento", action-to "/orcamento" in `app/pages/dashboard.vue`

**Checkpoint**: Cash Flow tab shows all budget widgets (or empty state if no data). Switching to Credit Card hides them. SavingsGoalsWidget moved from sidebar to cash flow section.

---

## Phase 4: User Story 3 — Seamless Tab Switching (Priority: P2)

**Goal**: Tab switching preserves all state (month, card) and the tab bar matches the Auditoria page visual pattern on all viewports.

**Independent Test**: Select a month and card on Credit Card tab, switch to Cash Flow and back — selections preserved. Verify tab bar looks identical to Auditoria page. Test on mobile viewport.

### Implementation for User Story 3

- [x] T014 [US3] Verify month navigation controls remain outside both v-show blocks (always visible) in `app/pages/dashboard.vue` — move if needed
- [x] T015 [US3] Verify global elements (AI FAB, TransactionDrawer, AIMobileDrawer, ConfirmDialog, ProactiveAdvisor) remain outside both v-show blocks in `app/pages/dashboard.vue`

**Checkpoint**: All state persists across tab switches. Global elements always visible. Tab bar responsive on mobile.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T016 Run `npm run lint` and fix any new lint errors in `app/pages/dashboard.vue`
- [x] T017 Run quickstart.md validation checklist (all 10 test items) against `specs/002-dashboard-tabs/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **US1 (Phase 2)**: Depends on Setup (T001-T003) — tab state and tab bar must exist
- **US2 (Phase 3)**: Depends on Setup (T001-T003) — tab state and tab bar must exist
- **US3 (Phase 4)**: Depends on US1 + US2 completion — verifies cross-tab behavior
- **Polish (Phase 5)**: Depends on all phases complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 1 only. No dependency on other stories.
- **User Story 2 (P1)**: Depends on Phase 1 only. No dependency on other stories. Note: T012 moves SavingsGoalsWidget from sidebar (US1 territory) so should run after US1 tasks.
- **User Story 3 (P2)**: Depends on US1 + US2 being complete. Verification-only phase.

### Within Each User Story

- Tasks are sequential (all modify the same file)
- No parallel opportunities within a phase

### Parallel Opportunities

- US1 (Phase 2) and US2 (Phase 3) could theoretically run in parallel since they wrap different sections, but since they modify the same file, sequential execution is safer and recommended.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: US1 — Credit Card tab (T004-T008)
3. **STOP and VALIDATE**: Credit card content now under a tab, cash flow widgets still visible (not yet wrapped)
4. This delivers the core tab infrastructure + card-focused view

### Incremental Delivery

1. Setup (T001-T003) → Tab bar visible, no content changes
2. US1 (T004-T008) → Credit card widgets wrapped → Validate
3. US2 (T009-T013) → Cash flow widgets wrapped + empty state → Validate
4. US3 (T014-T015) → Cross-tab verification → Validate
5. Polish (T016-T017) → Lint + full checklist → Done

---

## Notes

- All tasks modify `app/pages/dashboard.vue` — sequential execution recommended
- Reference `app/pages/audit/index.vue` (lines 352-377) for exact tab bar HTML/CSS
- Use `v-show` (not `v-if`) for tab content per research.md decision
- Reuse existing `EmptyState.vue` component for cash flow empty state
- Commit after each phase checkpoint
