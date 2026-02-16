# Tasks: Orcamento Mensal (Monthly Budget)

**Input**: Design documents from `/specs/001-orcamento-mensal/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Integration tests added for financial API endpoints per Constitution requirement (Quality Assurance: "API endpoints handling financial data MUST have integration tests").

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Nuxt full-stack**: `app/` (frontend), `server/` (backend), `prisma/` (schema)
- Pages: `app/pages/`
- Components: `app/components/budget/`
- Composables: `app/composables/`
- API routes: `server/api/`
- Utilities: `server/utils/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema changes and navigation setup

- [x] T001 Add `Income` and `CategoryBudget` models to `prisma/schema.prisma` with fields, relations, and indexes per data-model.md. Add `budget CategoryBudget?` relation to existing `Category` model
- [x] T002 Run `npx prisma migrate dev --name add-income-and-category-budget` to generate and apply migration
- [x] T003 Add "Orcamento" navigation item to the "Principal" group in `app/components/layout/Sidebar.vue` with Lucide `Wallet` icon and path `/orcamento`, positioned after "Parcelamentos"

**Checkpoint**: Schema migrated, nav item visible. No new pages or APIs yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared composable and loading skeleton used by ALL user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create `app/composables/useBudget.ts` composable with: reactive `budgetParams` (month, year), `useFetch` call to `/api/budget/summary` with computed key and watched params, `bumpDataVersion` integration, and typed `BudgetSummary` response interface per data-model.md. Note: endpoint created in T010 — composable will return pending/null until Phase 3, which is expected
- [x] T005 [P] Create `app/components/budget/BudgetSkeleton.vue` loading skeleton component following the pattern in existing `DashboardSkeleton.vue` — include placeholder rows for overview card, income list, and category list sections

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Set Monthly Income and See Budget Overview (Priority: P1) MVP

**Goal**: Users can register income sources and see income vs total credit card spending with remaining balance

**Independent Test**: Navigate to `/orcamento`, add income entries, verify overview shows total income, total spending from existing installments, and remaining balance

### Backend — Income CRUD

- [x] T006 [P] [US1] Implement `GET /api/income` in `server/api/income/index.get.ts` — Zod-validate `month` + `year` query params, fetch incomes for user (including recurring incomes from prior months), return `{ incomes, totalIncome }` per contracts/api.md. Use `getUser(event)`, `serializeDecimals()`. Ensure Zod validation error responses do not echo back financial amounts
- [x] T007 [P] [US1] Implement `POST /api/income` in `server/api/income/index.post.ts` — Zod-validate body (description max 100 chars, amount > 0, isRecurring boolean, month 1-12, year >= 2020), create with `userId` from auth, return serialized income. Ensure Zod validation error responses do not echo back financial amounts
- [x] T008 [P] [US1] Implement `PUT /api/income/:id` in `server/api/income/[id].put.ts` — Zod-validate body, verify ownership (`userId` match), update and return serialized income. Return 404 if not found or not owned. Ensure error responses do not echo back financial amounts
- [x] T009 [P] [US1] Implement `DELETE /api/income/:id` in `server/api/income/[id].delete.ts` — verify ownership, delete, return `{ success: true }`. Return 404 if not found or not owned

### Backend — Budget Summary

- [x] T010 [US1] Implement `GET /api/budget/summary` in `server/api/budget/summary.get.ts` — Zod-validate `month` + `year` query params, fetch incomes (including recurring), fetch installments for month grouped by category, fetch CategoryBudgets, compute `BudgetSummary` response with `totalIncome`, `totalSpending`, `remaining`, `savingsRate`, `incomes[]`, and `categories[]` with status thresholds per data-model.md. Reuse installment query pattern from `server/api/reports/category-spending.get.ts`. Ensure Zod validation error responses do not echo back financial amounts

### Frontend — Income Components

- [x] T011 [P] [US1] Create `app/components/budget/IncomeDrawer.vue` — mobile-friendly drawer (using existing Drawer component) with form fields: description (text input), amount (number input with currency formatting), isRecurring (toggle/switch), month/year (auto-filled from current). Submit calls `$fetch('/api/income', { method: 'POST' })`. Support edit mode via `incomeId` prop that pre-fills form and calls PUT
- [x] T012 [P] [US1] Create `app/components/budget/IncomeList.vue` — displays list of income entries for the current month with amount, description, recurring badge. Each item has edit (opens IncomeDrawer in edit mode) and delete (with ConfirmDialog) actions. Shows empty state when no incomes exist with CTA to add first income

### Frontend — Overview and Page

- [x] T013 [US1] Create `app/components/budget/BudgetOverviewCard.vue` — displays total income, total spending, remaining balance, and savings rate percentage. Use Card component with status variant (success if remaining > 0, danger if negative). Include a circular or bar progress indicator showing income utilization
- [x] T014 [US1] Create `app/pages/orcamento.vue` — main budget page following dashboard pattern: PageHeader (desktop) + mobile header, BudgetSkeleton while loading, month/year navigation (prev/next month buttons), BudgetOverviewCard, IncomeList with "Adicionar Receita" FAB/button. Wire up `useBudget` composable and `useDataVersion` for cache invalidation after mutations

- [x] T033 [US1] Add pull-to-refresh and optimistic updates to `app/pages/orcamento.vue` — implement pull-to-refresh gesture (call `refreshBudget()` from useBudget composable on pull). Add optimistic update for income create/delete: immediately update local list state before server confirms, rollback on error with toast notification. Follow existing pattern from dashboard if present, or use @vueuse/core `useSwipe` for gesture detection

**Checkpoint**: User Story 1 fully functional — users can add income and see budget overview with real spending data from existing installments

---

## Phase 4: User Story 2 — Category Spending Limits (Priority: P2)

**Goal**: Users can set per-category spending limits and see progress bars with threshold warnings (80% amber, 100%+ red)

**Independent Test**: Set a budget limit on a category, verify progress bar shows actual spending vs limit with correct status coloring

### Backend — Category Budget CRUD

- [x] T015 [P] [US2] Implement `GET /api/category-budgets` in `server/api/category-budgets/index.get.ts` — fetch all CategoryBudget records for user with included category name and color, return serialized array. Ensure error responses do not echo back financial amounts
- [x] T016 [P] [US2] Implement `PUT /api/category-budgets/:categoryId` in `server/api/category-budgets/[categoryId].put.ts` — Zod-validate body (amount >= 0), verify category ownership (category.userId matches auth userId), upsert CategoryBudget (create or update), return serialized result. Ensure Zod validation error responses do not echo back financial amounts
- [x] T017 [P] [US2] Implement `DELETE /api/category-budgets/:categoryId` in `server/api/category-budgets/[categoryId].delete.ts` — verify category ownership, delete CategoryBudget if exists, return `{ success: true }`

### Frontend — Category Budget Components

- [x] T018 [US2] Create `app/components/budget/CategoryBudgetDrawer.vue` — drawer with category name display (read-only), amount input for limit. Submit calls PUT endpoint (upsert). Receives `categoryId`, `categoryName`, and optional current `budgetLimit` as props
- [x] T019 [US2] Create `app/components/budget/CategoryBudgetList.vue` — renders categories from budget summary `categories[]` array. Each row shows: category name (with color dot), progress bar (actual/limit), amount text ("R$640 / R$800"), status badge. Progress bar colors: default for under, amber/warning for >= 80%, red/danger for > 100%, muted for no-limit. Tap on a category opens CategoryBudgetDrawer. Categories without limits show spending amount with "Definir meta" link
- [x] T020 [US2] Integrate `CategoryBudgetList` into `app/pages/orcamento.vue` — add as a new section below BudgetOverviewCard. Wire drawer open/close state. After setting/updating a limit, call `bumpDataVersion()` to refresh summary data

**Checkpoint**: User Stories 1 AND 2 both work independently — income overview + category spending limits with visual progress

---

## Phase 5: User Story 3 — Budget vs Actual Monthly Report (Priority: P3)

**Goal**: Users can view a month-end summary comparing budget vs actual with month-over-month trends

**Independent Test**: With at least one completed month of data (income + limits + transactions), view the report showing totals, per-category variance, and trend arrows compared to previous month

### Backend — Report

- [x] T021 [US3] Implement `GET /api/budget/report` in `server/api/budget/report.get.ts` — Zod-validate `month` + `year` query params. Compute current month summary (reuse logic from summary endpoint). Compute previous month summary. Calculate trends (income change %, spending change %, savings rate change). Build `categoryComparison[]` with trend direction per category. Return response per contracts/api.md

### Frontend — Report Component

- [x] T022 [US3] Create `app/components/budget/BudgetReport.vue` — displays: summary cards (income, spending, savings rate with trend arrows), per-category table/list showing current vs previous spending with change percentage and trend icon (TrendingUp/TrendingDown from Lucide). Categories over budget highlighted. Show "Sem dados do mes anterior" message when previous month is null
- [x] T023 [US3] Integrate `BudgetReport` into `app/pages/orcamento.vue` — add as a collapsible/expandable section or tab at the bottom of the page. Only render when user has data for the selected month

**Checkpoint**: All three core user stories functional — overview, limits, and reporting

---

## Phase 6: User Story 4 — AI Budget Advisor Integration (Priority: P4)

**Goal**: AI advisor can access budget data and provide budget-specific recommendations

**Independent Test**: Trigger the advisor with budget data present. Response includes budget-specific recommendations referencing income, spending limits, and savings rate

- [x] T024 [US4] Extend `gatherAdvisorContext()` in `server/utils/advisor-context.ts` — add budget metrics to context: total monthly income, savings rate, top 3 over-budget categories (name + overage %), and overall budget utilization. Use aggregates only (no raw transaction amounts per Constitution Principle II). Query Income and CategoryBudget + Installments for current month
- [x] T025 [US4] Add `budget_review` trigger type to `server/api/advisor/analyze.post.ts` — add budget-specific prompt template that instructs the AI to analyze spending vs limits, suggest category limit adjustments with explicit reasoning based on historical spending patterns (e.g., "Your Alimentacao spending averaged R$X over 3 months, so a limit of R$Y is more realistic"), and recommend savings strategies. Ensure response is labeled as AI-generated. Include error boundary: if AI call fails or times out, return a structured fallback response with generic budget tips (e.g., "Tente manter gastos abaixo de 80% do limite por categoria") instead of propagating the error

**Checkpoint**: All four user stories complete

---

## Phase 7: User Story 5 — Add-Expense Fixes and Improvements (Priority: P5)

**Goal**: Fix card selector, drawer styling, AI inline preview in the expense drawer, and deprecate the full-page `/add-expense` route

**Independent Test**: Open FAB drawer, verify card selector works, drawer colors match theme, AI mode shows inline parsed results. Navigate to `/add-expense` and verify redirect to `/dashboard`

**Scope**: Fixes apply to existing files only — no new components created

- [x] T034 [P] [US5] Fix card selector in `app/components/transaction/TransactionDrawer.vue` — ensure the card selector is visible and pre-filled with the user's default card (`isDefault`), allow switching to any other card. Verify the selected card is sent when creating the transaction
- [x] T035 [P] [US5] Fix drawer background colors in `app/components/ui/drawer/DrawerContent.vue` — replace current `bg-background/98` with theme-correct tokens so dark mode shows dark background (not white translucent) and light mode shows light background (not purple translucent). Use design system CSS variables for glass/surface colors
- [x] T036 [US5] Refactor AI mode in `app/components/transaction/TransactionDrawer.vue` — instead of switching to the manual form tab after AI parse, show a read-only inline summary section below the textarea displaying parsed fields (description, amount, card, category) with an "Adicionar" button to submit directly. Add an "Editar" link that switches to the manual form tab pre-filled with the parsed values. Handle AI parse failure: show error message below textarea, keep text intact for retry
- [x] T037 [P] [US5] Deprecate full-page add-expense route — replace `app/pages/add-expense.vue` content with a redirect to `/dashboard` (silent redirect, no message). Remove or simplify the page to just the redirect logic

**Checkpoint**: All five user stories complete — budget features + expense drawer fixes

---

## Phase 8: Integration Tests & Polish

**Purpose**: Constitution-mandated integration tests, edge cases, empty states, and validation

### Integration Tests (Constitution: "API endpoints handling financial data MUST have integration tests")

- [x] T030 [P] Write integration test for `POST /api/income` in `tests/integration/budget/income.test.ts` — test: create income with valid data returns 201, reject invalid amount (<= 0), reject missing description, verify userId isolation (user A cannot read user B income)
- [x] T031 [P] Write integration test for `GET /api/budget/summary` in `tests/integration/budget/summary.test.ts` — test: returns correct totalIncome from multiple incomes (including recurring), returns correct totalSpending from installments, returns category breakdown with correct status thresholds (under/warning/exceeded), verify userId isolation
- [x] T032 [P] Write integration test for `PUT /api/category-budgets/:categoryId` in `tests/integration/budget/category-budgets.test.ts` — test: upsert creates new budget, upsert updates existing budget, reject if category not owned by user (404), verify cascade delete when category removed

### Polish

- [x] T026 [P] Refine empty states in `app/pages/orcamento.vue` — handle: no income + no transactions (full onboarding empty state with CTA), income but no transactions (show overview with R$0 spent), transactions but no income (show spending summary with prompt to add income)
- [x] T027 [P] Refine month navigation in `app/pages/orcamento.vue` — ensure prev/next month buttons correctly update all child components via `useBudget` params, handle edge cases (first month ever, future months with no data)
- [x] T028 Run `specs/001-orcamento-mensal/quickstart.md` validation steps end-to-end to verify full feature flow
- [x] T029 Performance validation — verify budget page loads within 2 seconds on throttled 4G (Chrome DevTools Network throttling), check no N+1 queries in summary endpoint, run `npx nuxt analyze` and verify no significant bundle size regression (must stay under 500KB initial load per Constitution)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 + T002 (schema must exist for composable types)
- **US1 (Phase 3)**: Depends on Phase 2 completion — can start immediately after
- **US2 (Phase 4)**: Depends on Phase 2 completion — can start in parallel with US1 but benefits from US1 page existing
- **US3 (Phase 5)**: Depends on Phase 2 completion — benefits from US1 + US2 data being available
- **US4 (Phase 6)**: Depends on Phase 2 completion — benefits from US1-US3 providing budget data
- **US5 (Phase 7)**: No dependencies on budget phases — can run in parallel with any phase (modifies different files)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — only requires Phase 2 foundation
- **US2 (P2)**: Soft dependency on US1 — CategoryBudgetList integrates into the page created in US1, but the API endpoints are fully independent
- **US3 (P3)**: Soft dependency on US1 + US2 — report is most useful with income and limits set, but works with just spending data
- **US4 (P4)**: Soft dependency on US1-US3 — advisor needs budget data to generate meaningful recommendations
- **US5 (P5)**: Fully independent — modifies existing expense drawer files, no overlap with budget feature files

### Within Each User Story

- Backend endpoints before frontend components (data must be available)
- Components before page integration (building blocks first)
- All [P] tasks within a phase can run in parallel

### Parallel Opportunities

- T003 runs in parallel with T001-T002 (different files)
- T004 and T005 are parallel (different files)
- T006, T007, T008, T009 are ALL parallel (different API route files)
- T011 and T012 are parallel (different component files)
- T015, T016, T017 are ALL parallel (different API route files)
- T030, T031, T032 are ALL parallel (different test files)
- T026 and T027 are parallel (different concerns in same file, non-overlapping sections)
- T034, T035, T037 are parallel (different files)
- US5 tasks (T034-T037) can run in parallel with ANY budget phase (completely different files)

---

## Parallel Example: User Story 1

```bash
# Launch all Income API endpoints together (different files):
Task: T006 "GET /api/income in server/api/income/index.get.ts"
Task: T007 "POST /api/income in server/api/income/index.post.ts"
Task: T008 "PUT /api/income/:id in server/api/income/[id].put.ts"
Task: T009 "DELETE /api/income/:id in server/api/income/[id].delete.ts"

# Then budget summary (depends on Income model existing):
Task: T010 "GET /api/budget/summary in server/api/budget/summary.get.ts"

# Launch frontend components together (different files):
Task: T011 "IncomeDrawer in app/components/budget/IncomeDrawer.vue"
Task: T012 "IncomeList in app/components/budget/IncomeList.vue"

# Then compose into page (depends on components):
Task: T013 "BudgetOverviewCard in app/components/budget/BudgetOverviewCard.vue"
Task: T014 "orcamento.vue page integrating all US1 components"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T014)
4. **STOP and VALIDATE**: Navigate to `/orcamento`, add income, verify overview shows income vs spending
5. Deploy/demo if ready — users can already see their financial position

### Incremental Delivery

1. Setup + Foundational → Schema and scaffolding ready
2. User Story 1 → Income + overview → **MVP deployed**
3. User Story 2 → Category limits with progress bars → Enhanced budgeting
4. User Story 3 → Monthly reports with trends → Feedback loop closed
5. User Story 4 → AI advisor integration → Intelligence layer
6. User Story 5 → Add-expense drawer fixes → UX improvements (can run anytime)
7. Polish → Edge cases, performance → Production ready

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All API routes follow existing patterns: Zod validation → getUser(event) → Prisma query → serializeDecimals()
- All money operations use moneyToCents() / moneyFromCents() from server/utils/money.ts
- All components follow mobile-first responsive design with desktop enhancement
