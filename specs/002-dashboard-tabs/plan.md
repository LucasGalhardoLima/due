# Implementation Plan: Dashboard Tabbed Reorganization

**Branch**: `002-dashboard-tabs` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-dashboard-tabs/spec.md`

## Summary

Reorganize the Dashboard page (`app/pages/dashboard.vue`) by splitting its content into two tabs — "Cartao de Credito" and "Fluxo de Caixa" — using the same pill-style segmented control pattern from the Auditoria page. This is a frontend-only refactor: no new APIs, no data model changes, no new dependencies. The existing widgets are grouped into their respective tabs using `v-show` for instant switching while preserving all data fetching and state management.

## Technical Context

**Language/Version**: TypeScript 5.9, Vue 3.5, Nuxt 4.2
**Primary Dependencies**: Vue 3 (Composition API), shadcn-vue, Lucide icons — no new dependencies
**Storage**: N/A — no data model changes
**Testing**: Manual visual testing + existing lint (`npm run lint`)
**Target Platform**: Web (mobile-first responsive)
**Project Type**: Web application (Nuxt fullstack)
**Performance Goals**: Tab switching < 100ms, no additional network requests on switch
**Constraints**: Single file refactor (`dashboard.vue`), must match Auditoria tab visual pattern exactly
**Scale/Scope**: 1 page modified, ~13 existing widgets redistributed across 2 tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Privacy-First Architecture | PASS | No data changes — widgets display same user-scoped data |
| II. Intelligent AI Boundaries | PASS | AI Insights and Purchase Simulator unchanged — just relocated to Credit Card tab |
| III. Performance & Mobile Excellence | PASS | `v-show` keeps DOM alive (no re-fetch on switch), tab switching is instant. Tab bar is responsive. Mobile is primary design target |

**Code Quality Gates**:
- TypeScript strict mode: PASS — no new types needed, existing types remain
- Zod validation: N/A — no API changes
- Component props typed: PASS — no new components, existing components unchanged
- No `any` types: PASS — `activeTab` typed as string union

**Result**: All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-dashboard-tabs/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (minimal — frontend-only refactor)
└── quickstart.md        # Phase 1 output
```

### Source Code (repository root)

```text
app/
├── pages/
│   └── dashboard.vue          # PRIMARY — add tab state + wrap widgets in v-show sections
└── components/
    └── ui/
        └── EmptyState.vue     # REUSE — for Fluxo de Caixa empty state
```

**Structure Decision**: Single-file refactor. All changes are in `app/pages/dashboard.vue`. No new components needed — the tab bar pattern is inline HTML (matching Auditoria page) and the empty state reuses the existing `EmptyState.vue` component.

## Implementation Approach

### Step 1: Add tab state and tab bar

Add a reactive `activeTab` ref defaulting to `'card'`. Insert the tab bar between the header and content sections, matching the Auditoria page's exact HTML/CSS pattern:

```vue
const activeTab = ref<'card' | 'cashflow'>('card')
```

Tab bar placement:
- **Desktop**: Below `PageHeader`, above content
- **Mobile**: Below the mobile header/controls row, above content

### Step 2: Wrap "Cartao de Credito" widgets in v-show

Wrap with `v-show="activeTab === 'card'"`:
- Crisis Alerts (card-related)
- SummaryCards
- Transaction List + AI Insights sidebar (the `grid-cols-[1fr_380px]` section)
- Purchase Simulator (within sidebar)
- Future Projection (within sidebar)

Also conditionally show the card selector only when `activeTab === 'card'`.

### Step 3: Wrap "Fluxo de Caixa" widgets in v-show

Wrap with `v-show="activeTab === 'cashflow'"`:
- FreeToSpendCard
- DuScoreCard + SpendingPaceChart + NetThisMonthCard (the 3-col grid)
- TrendingBudgetsCard + UpcomingBillsCard (the 2-col grid)
- SavingsGoalsWidget

Add consolidated empty state when no budget data exists (`!budgetSummary || budgetSummary.totalIncome === 0`), using the existing `EmptyState` component with a CTA linking to `/orcamento`.

### Step 4: Keep global elements outside both tabs

These remain always visible regardless of active tab:
- PageHeader (desktop) and mobile header
- Month navigation controls
- AI FAB (mobile)
- TransactionDrawer
- AIMobileDrawer
- ConfirmDialog (pay invoice)
- ProactiveAdvisor

### Key Design Decisions

1. **`v-show` over `v-if`**: Matches the Auditoria page pattern. Keeps DOM alive so all data fetching happens once on mount. No re-fetch on tab switch. Instant toggle.

2. **No new component extraction**: The tab bar is ~15 lines of template (3 buttons in a flex container). Creating a separate component would be over-engineering for 2 buttons.

3. **Card selector visibility**: Use `v-show="activeTab === 'card'"` on the card selector `<Select>` in both desktop and mobile header sections.

4. **Empty state for Fluxo de Caixa**: Check `budgetSummary?.totalIncome > 0` — if false, show single EmptyState instead of all the budget widgets. This matches the existing pattern where FreeToSpendCard already has this guard.
