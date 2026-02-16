# Feature Specification: Orcamento Mensal (Monthly Budget)

**Feature Branch**: `001-orcamento-mensal`
**Created**: 2026-02-11
**Status**: Ready for Implementation
**Input**: Phase 2 of Due_Analise_Estrategica_2026.md — "Orcamento Mensal (gestao de receitas vs despesas, metas de gastos por categoria)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Monthly Income and See Budget Overview (Priority: P1)

Fernanda opens the new "Orcamento" page and registers her monthly income (R$5,500 salary + R$800 freelance). She immediately sees how much of her income is committed to credit card invoices and how much remains as "breathing room." The system shows a clear visual of income vs total projected credit card spending for the selected month. Users can navigate between months (prev/next) to view past or future projections.

**Why this priority**: Without income registration, there is no budget to track. This is the foundation — users need to see income vs credit card spending to understand their real financial position.

**Independent Test**: Can be fully tested by adding income entries and viewing the budget overview page. Delivers immediate value by showing the gap between income and credit card commitments.

**Acceptance Scenarios**:

1. **Given** a user with no income registered, **When** they navigate to /orcamento, **Then** they see an empty state prompting them to add their first income source
2. **Given** a user adds income of R$5,500 (salary, recurring monthly), **When** the budget overview loads, **Then** it displays total income, total projected invoice spending, and the remaining balance
3. **Given** a user with income and existing credit card transactions, **When** viewing the budget overview, **Then** the projected spending is calculated from existing installments/invoices for the current billing cycle
4. **Given** a user with multiple income sources, **When** viewing the overview, **Then** all income sources are summed and each is listed individually

---

### User Story 2 - Category Spending Limits (Priority: P2)

Fernanda sets a monthly spending limit of R$800 for "Alimentacao" and R$200 for "Assinaturas." Throughout the month, she can see a progress bar per category showing how close she is to each limit. When she reaches 80% of a limit, she gets a visual warning. When she exceeds it, the bar turns red.

**Why this priority**: Category limits are the core budgeting mechanic that helps users control spending behavior. This builds on P1 (income) to create actionable spending constraints.

**Independent Test**: Can be tested by setting a budget limit on any category and adding transactions to that category. The progress bar and threshold warnings provide immediate visual feedback.

**Acceptance Scenarios**:

1. **Given** a user on the budget page, **When** they tap a category, **Then** they can set a monthly spending limit for that category
2. **Given** a category with a R$800 limit and R$640 spent (80%), **When** the user views the budget, **Then** the category shows a warning indicator (amber)
3. **Given** a category with a R$800 limit and R$850 spent, **When** the user views the budget, **Then** the category shows an exceeded indicator (red) with the overage amount
4. **Given** a new month starts, **When** the user views budget, **Then** category spending resets to R$0 against the same limits (limits persist month-to-month)

---

### User Story 3 - Budget vs Actual Monthly Report (Priority: P3)

At the end of the month, Fernanda wants to see how she performed against her budget. She views a month-end summary showing: total income vs total spent, per-category budget vs actual, categories where she was under/over budget, and a trend compared to the previous month.

**Why this priority**: Retrospective analysis closes the feedback loop. Users need to see past performance to adjust future behavior. Depends on P1 and P2 data being available.

**Independent Test**: Can be tested by having at least one completed month with income and category limits set. Shows summary cards and a per-category breakdown with variance.

**Acceptance Scenarios**:

1. **Given** a user with income, category limits, and transactions for January 2026, **When** they view the January report, **Then** they see total income, total spent, savings (or deficit), and per-category breakdown
2. **Given** a user exceeded their "Alimentacao" budget by R$120, **When** viewing the report, **Then** that category is highlighted with the overage and a suggestion to adjust
3. **Given** a user viewing February report, **When** January data exists, **Then** the report shows month-over-month comparison (arrows up/down per category)

---

### User Story 4 - AI Budget Advisor Integration (Priority: P4)

Fernanda asks the AI Advisor for help optimizing her budget. The advisor analyzes her income, spending patterns, and category limits to suggest realistic budget adjustments — e.g., "You consistently spend R$950 on Alimentacao but budget R$800. Consider raising to R$900 and reducing Lazer by R$100."

**Why this priority**: AI-powered suggestions differentiate Due from spreadsheet-based budgeting. However, this depends on P1-P3 having enough data to generate meaningful insights.

**Independent Test**: Can be tested by triggering the advisor with budget data present. The AI response includes budget-specific recommendations.

**Acceptance Scenarios**:

1. **Given** a user with 2+ months of budget data, **When** they ask the AI advisor about their budget, **Then** the advisor provides personalized recommendations referencing their actual spending vs limits
2. **Given** a user whose spending consistently exceeds a category limit, **When** the advisor analyzes, **Then** it suggests a realistic limit based on historical patterns
3. **Given** a user with surplus income, **When** the advisor analyzes, **Then** it suggests allocation strategies (emergency fund, debt payoff acceleration)

---

### Edge Cases

- What happens when a user has no credit card transactions yet but sets income? → Show budget overview with R$0 spent and full income as "available"
- What happens when a user has transactions but no income set? → Show spending summary with a prompt to add income for full budget view
- How does the system handle mid-month income changes? → Income applies from the current month; previous months are not retroactively changed
- What happens when a user deletes a category that has a budget limit? → Budget limit is deleted along with the category
- How does the system handle installment transactions that span multiple months? → Each month's installment amount counts toward that month's category budget
- What happens when a category has no budget limit set? → It still shows actual spending but without limit/progress indicators

---

### User Story 5 - Add-Expense Fixes and Improvements (Priority: P5)

Fernanda taps the FAB button to add an expense. She needs to select a different card than her default, but the selector doesn't work properly. The drawer background colors are inverted (white translucent in dark mode, purple translucent in light mode). When using AI mode, she types a natural language description and wants to see the parsed results inline below the textarea — with the option to submit directly — instead of being switched to the manual form tab. The full-page `/add-expense` route is deprecated in favor of the drawer as the single add-expense interface.

**Why this priority**: These are UX fixes to an existing critical flow (adding expenses). They don't depend on budget features but improve overall app quality. Bundled into this branch for convenience. Deprecating the full-page route reduces maintenance burden and enforces the mobile-first drawer as the canonical add flow.

**Independent Test**: Open the FAB drawer. Verify card selector shows all cards with default pre-selected. Verify drawer colors match the design system in both dark/light mode. Use AI mode, verify parsed results appear inline with direct submit option. Verify `/add-expense` page is removed or redirects to dashboard.

**Scope**: Fixes apply to `app/components/transaction/TransactionDrawer.vue`. Full-page `app/pages/add-expense.vue` is deprecated and removed.

**Acceptance Scenarios**:

1. **Given** a user with multiple credit cards, **When** they open the expense drawer (FAB), **Then** they see a card selector pre-filled with their default card and can switch to any other card
2. **Given** dark mode is active, **When** the user opens the expense drawer, **Then** the drawer background matches the dark theme (not white translucent)
3. **Given** light mode is active, **When** the user opens the expense drawer, **Then** the drawer background matches the light theme (not purple translucent)
4. **Given** a user in AI mode types "Almoco no restaurante 45 reais nubank", **When** the AI parses the text, **Then** a summary section appears below the textarea showing the parsed fields (description, amount, card, category) with an "Adicionar" button to submit directly
5. **Given** the AI parsed results are shown inline, **When** the user notices a wrong field, **Then** they can tap "Editar" to switch to the manual form pre-filled with the parsed values for correction
6. **Given** a user navigates to `/add-expense`, **When** the page loads, **Then** they are redirected to the dashboard (full-page add-expense deprecated)

---

### Edge Cases

- What happens when a user has no credit card transactions yet but sets income? → Show budget overview with R$0 spent and full income as "available"
- What happens when a user has transactions but no income set? → Show spending summary with a prompt to add income for full budget view
- How does the system handle mid-month income changes? → Income applies from the current month; previous months are not retroactively changed
- What happens when a user deletes a category that has a budget limit? → Budget limit is deleted along with the category
- How does the system handle installment transactions that span multiple months? → Each month's installment amount counts toward that month's category budget
- What happens when a category has no budget limit set? → It still shows actual spending but without limit/progress indicators
- What happens when AI fails to parse the expense text? → Show error message below textarea, keep text intact for manual editing or retry
- What happens when AI parses but user wants to change a field? → Read-only summary with "Editar" link that switches to manual form pre-filled with parsed values

## Clarifications

### Session 2026-02-12

- Q: Should the three fixes (card selector, drawer styling, AI inline results) apply to both the full-page /add-expense AND the bottom drawer, or just the drawer? → A: Drawer for all fixes + deprecate the full-page `/add-expense` entirely (use drawer as the only add flow)
- Q: After AI parses the expense text, what should the inline preview look like? → A: Read-only summary card showing parsed fields with a single "Adicionar" button. "Editar" link switches to manual form pre-filled if correction needed.
- Q: When /add-expense is deprecated, what should happen if a user navigates there directly? → A: Redirect to /dashboard — silent redirect, no message

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create, edit, and delete income entries with: amount, description, and recurrence (one-time or monthly)
- **FR-002**: System MUST calculate total monthly income from all active income sources
- **FR-003**: System MUST display a budget overview showing: total income, total projected credit card spending (from installments), and remaining balance
- **FR-004**: Users MUST be able to set a monthly spending limit (budget) per category
- **FR-005**: System MUST calculate actual spending per category for a given month from installment data
- **FR-006**: System MUST display visual progress indicators (progress bar) per category showing spent vs limit
- **FR-007**: System MUST display threshold warnings at 80% utilization (amber) and 100%+ (red)
- **FR-008**: Category budget limits MUST persist across months until manually changed
- **FR-009**: System MUST provide a monthly report comparing budget vs actual per category
- **FR-010**: System MUST show month-over-month trends when previous month data exists
- **FR-011**: AI Advisor MUST be able to access budget data to generate budget-specific recommendations
- **FR-012**: All budget data MUST be isolated by userId (multi-tenancy)
- **FR-013**: Budget page MUST load within 2 seconds on 4G (per Constitution Principle III)
- **FR-014**: Budget overview MUST be mobile-first with responsive desktop enhancement
- **FR-015**: Expense drawer MUST show a card selector pre-filled with the user's default card (`isDefault`), allowing selection of any card
- **FR-016**: Expense drawer background MUST match the active theme (dark/light mode) using correct design system tokens
- **FR-017**: AI mode in the expense drawer MUST show parsed results as a read-only inline summary below the textarea with an "Adicionar" button for direct submission and an "Editar" link to switch to manual form pre-filled with parsed values
- **FR-018**: The full-page `/add-expense` route MUST redirect to `/dashboard` (deprecated in favor of the drawer)

### Key Entities

- **Income**: Represents a user's income source (amount, description, isRecurring, month/year). One user can have multiple income entries.
- **CategoryBudget**: Represents a monthly spending limit for a specific category. Links a category to a limit amount. Persists month-to-month.
- **BudgetSummary** (computed): Aggregation of income, spending, and category budgets for a given month. Not persisted — calculated from Income, CategoryBudget, and existing Installment data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can set up income and view budget overview in under 60 seconds
- **SC-002**: Category budget progress updates reflect real spending data within the same page load
- **SC-003**: Budget page initial load completes within 2 seconds on 4G
- **SC-004**: Monthly report accurately reflects all installment data for the selected period
- **SC-005**: AI advisor references budget data in at least 80% of budget-context queries
