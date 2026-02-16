# Research: Orcamento Mensal (Monthly Budget)

**Date**: 2026-02-11
**Status**: Complete

## R1: Existing Budget Infrastructure

**Decision**: Create new `Income` and `CategoryBudget` models rather than reusing the existing `CreditCard.budget` field.

**Rationale**: The existing `CreditCard.budget` field is a per-card soft spending goal. The Orcamento Mensal feature requires per-category monthly budgets and income tracking — fundamentally different data. The existing field can coexist as "card-level spending goal" while the new models handle full budget management.

**Alternatives considered**:
- Reuse `CreditCard.budget` only → Too limited, no category granularity, no income tracking
- Single `Budget` model with type discriminator → Over-engineered, mixes concerns

## R2: Data Fetching Pattern

**Decision**: Use `useFetch()` with computed query params and watched dependencies, matching the dashboard pattern.

**Rationale**: This is the established pattern across all Due pages (dashboard, parcelamentos, categories). It provides SSR compatibility, automatic caching via Nuxt's data layer, and reactive refetching when params change.

**Alternatives considered**:
- TanStack Vue Query → Available in deps but not used by any existing page. Would introduce a second data-fetching paradigm.
- Raw `$fetch()` in `onMounted` → Loses SSR benefits and Nuxt caching

## R3: Budget Calculation Strategy

**Decision**: Compute budget vs actual server-side by querying existing `Installment` data grouped by category for the target month. No new "spending" records needed.

**Rationale**: The app already calculates per-category spending in `reports/category-spending.get.ts` by querying installments with `dueDate` in the target month range and joining through `transaction.category`. The budget feature reuses this exact pattern, adding category budget limits for comparison.

**Alternatives considered**:
- Client-side aggregation → Moves too much data to client, poor mobile performance
- Materialized view / cron-computed summaries → Over-engineered for current scale

## R4: Navigation Placement

**Decision**: Add "Orcamento" to the "Principal" group in Sidebar.vue, between "Parcelamentos" and the "Gestao" group.

**Rationale**: Budget is a primary user-facing feature (not a management/settings feature). It sits naturally alongside Dashboard and Parcelamentos as a core financial view.

## R5: AI Advisor Integration

**Decision**: Extend `gatherAdvisorContext()` with budget metrics and add a new `budget_review` trigger type.

**Rationale**: The advisor context builder already queries installments and card limits. Adding income and category budget data is a natural extension. A dedicated trigger allows budget-specific prompts without polluting existing triggers.

**Alternatives considered**:
- Separate advisor endpoint → Fragments the advisor API unnecessarily
- Only extend existing triggers → Misses the opportunity for dedicated budget insights

## R6: Page Route

**Decision**: Use `/orcamento` as the route (not `/budget`).

**Rationale**: The app is in Portuguese (Brazilian). All user-facing copy is in Portuguese. Using the Portuguese route name maintains consistency with the app's language identity. The strategic document uses "Orcamento Mensal" terminology.
