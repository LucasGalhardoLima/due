# Feature Specification: Dashboard Tabbed Reorganization

**Feature Branch**: `002-dashboard-tabs`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "The Dashboard page has too much information currently. There should be a clear separation on what's related to Credit Card, and what's related to Fluxo de caixa. Auditoria page has sub-tabs for different sections/functionalities"

## Clarifications

### Session 2026-02-26

- Q: Should the card selector be visible on the "Fluxo de Caixa" tab? → A: Hidden — only shown on "Cartao de Credito" tab where it's relevant.
- Q: When a user has no budget/income data, what should the "Fluxo de Caixa" tab show? → A: Single consolidated empty state with one CTA prompting budget/income setup.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Credit Card Information at a Glance (Priority: P1)

A user opens the Dashboard and wants to quickly check their credit card status — current invoice total, limit usage, due date, and recent transactions. Currently, this information is mixed with budget/cash flow widgets, making it hard to find. With tabbed navigation, users land on a focused "Cartao de Credito" tab that shows only card-related information.

**Why this priority**: Credit card monitoring is the app's core use case and the original purpose of the Dashboard. Most users visit the Dashboard to check their card status, so this must work flawlessly.

**Independent Test**: Can be fully tested by navigating to the Dashboard and verifying all credit card widgets (invoice summary, limit usage, due date, top category, transactions, purchase simulator, future projection) appear under the "Cartao de Credito" tab while no cash flow widgets are present.

**Acceptance Scenarios**:

1. **Given** a user is on the Dashboard, **When** they view the "Cartao de Credito" tab, **Then** they see: invoice total, limit usage percentage, due date countdown, top spending category, transaction list, purchase simulator, and future installment projections.
2. **Given** a user is on the "Cartao de Credito" tab, **When** they select a different card from the card selector, **Then** the credit card widgets update to reflect the selected card's data.
3. **Given** a user is on the "Cartao de Credito" tab, **When** they navigate months (forward/back), **Then** only the card-related data updates for the selected month.

---

### User Story 2 - View Cash Flow and Budget Overview (Priority: P1)

A user wants to understand their overall financial health — how much they can still spend this month, budget trends, upcoming bills, and savings progress. They switch to the "Fluxo de Caixa" tab to see all budget and cash flow widgets without credit card clutter.

**Why this priority**: Cash flow visibility is equally critical for financial planning. Users who have set up budgets and income tracking need a dedicated view to monitor their spending pace and savings.

**Independent Test**: Can be fully tested by switching to the "Fluxo de Caixa" tab and verifying all budget/cash flow widgets (free to spend, financial health score, spending pace, net this month, trending budgets, upcoming bills, savings goals) appear while no credit card widgets are present.

**Acceptance Scenarios**:

1. **Given** a user is on the Dashboard, **When** they switch to the "Fluxo de Caixa" tab, **Then** they see: free to spend card, financial health score, spending pace chart, net this month, trending budget categories, upcoming bills, and savings goals.
2. **Given** a user has no income or budget data configured, **When** they view the "Fluxo de Caixa" tab, **Then** a single consolidated empty state is shown with a CTA to set up budget/income (individual widgets are not rendered).
3. **Given** a user is on the "Fluxo de Caixa" tab, **When** a crisis alert is relevant to budget (e.g., spending trend alert), **Then** the alert appears within this tab.

---

### User Story 3 - Seamless Tab Switching (Priority: P2)

A user wants to quickly switch between credit card and cash flow views without losing their current context (selected month, selected card). The tab bar follows the same visual pattern used on the Auditoria page for consistency.

**Why this priority**: Smooth navigation between the two views is essential for usability, but depends on the core tab content being properly organized first.

**Independent Test**: Can be fully tested by switching between tabs multiple times and verifying that the selected month and card persist across switches, and the tab bar visually matches the Auditoria page pattern.

**Acceptance Scenarios**:

1. **Given** a user has selected "February 2026" and card "Nubank" on the "Cartao de Credito" tab, **When** they switch to "Fluxo de Caixa" and back, **Then** the month and card selection are preserved.
2. **Given** a user is on mobile, **When** they view the tab bar, **Then** the tabs are fully visible and tappable without horizontal scrolling.
3. **Given** a user navigates away from the Dashboard and returns, **When** the page loads, **Then** the default tab is displayed (first tab).

---

### Edge Cases

- What happens when a user has no credit cards registered? The "Cartao de Credito" tab shows the existing empty state prompting card registration; the "Fluxo de Caixa" tab remains functional.
- What happens when a user has cards but no budget/income data? The "Fluxo de Caixa" tab shows relevant empty states; the "Cartao de Credito" tab works normally.
- How does the AI Insights sidebar behave? It appears on the "Cartao de Credito" tab since insights are currently scoped to card transactions.
- How do crisis alerts display? Card-related alerts (future shortage) appear on the "Cartao de Credito" tab; spending trend alerts appear on "Fluxo de Caixa" tab.
- How does the AI FAB (mobile floating button) behave? It remains visible on both tabs as a global action.
- How does the Proactive Advisor behave? It remains global (toast-based), not tied to either tab.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Dashboard MUST display a tab bar with two tabs: "Cartao de Credito" and "Fluxo de Caixa"
- **FR-002**: The tab bar MUST follow the same visual design pattern as the Auditoria page (pill-style segmented control with active state highlight)
- **FR-003**: The "Cartao de Credito" tab MUST display: SummaryCards (invoice total, limit, due date, top category), card-related crisis alerts, transaction list, AI Insights panel, purchase simulator, and future installment projections
- **FR-004**: The "Fluxo de Caixa" tab MUST display: FreeToSpendCard, DuScoreCard, SpendingPaceChart, NetThisMonthCard, TrendingBudgetsCard, UpcomingBillsCard, and SavingsGoalsWidget
- **FR-005**: The month selector MUST remain in the page header, shared across both tabs. The card selector MUST only be visible on the "Cartao de Credito" tab and hidden on the "Fluxo de Caixa" tab
- **FR-006**: Tab switching MUST preserve the current month and card selection state
- **FR-007**: Tab content MUST switch instantly without full page reload (client-side toggle using show/hide)
- **FR-008**: The default active tab when first loading the Dashboard MUST be "Cartao de Credito", preserving the original experience
- **FR-009**: The tab bar MUST be responsive — fully visible and functional on both desktop and mobile viewports
- **FR-010**: The AI floating action button (mobile) and Proactive Advisor (toast) MUST remain visible and functional regardless of active tab
- **FR-011**: When the user has no budget or income data configured, the "Fluxo de Caixa" tab MUST display a single consolidated empty state with a CTA to set up budget/income instead of rendering individual empty widgets

### Widget-to-Tab Mapping

| Widget                                           | Tab               |
| ------------------------------------------------ | ----------------- |
| SummaryCards (invoice, limit, due, category)      | Cartao de Credito |
| Card-related Crisis Alerts                        | Cartao de Credito |
| Transaction List                                  | Cartao de Credito |
| AI Insights (sidebar, desktop)                    | Cartao de Credito |
| Purchase Simulator                                | Cartao de Credito |
| Future Projection                                 | Cartao de Credito |
| FreeToSpendCard                                   | Fluxo de Caixa    |
| DuScoreCard                                       | Fluxo de Caixa    |
| SpendingPaceChart                                 | Fluxo de Caixa    |
| NetThisMonthCard                                  | Fluxo de Caixa    |
| TrendingBudgetsCard                               | Fluxo de Caixa    |
| UpcomingBillsCard                                 | Fluxo de Caixa    |
| SavingsGoalsWidget                                | Fluxo de Caixa    |

### Assumptions

- The Auditoria page tab pattern (pill-style segmented control) is the desired visual pattern for consistency across the app.
- No new data fetching or API changes are needed — the existing data sources serve both tabs.
- The month navigation applies to both tabs (changing month affects credit card invoice period and budget period alike).
- Card selection only applies to the "Cartao de Credito" tab; the card selector is hidden when viewing the "Fluxo de Caixa" tab.
- The "Pay Invoice" confirmation dialog and transaction edit drawer remain functional within the credit card tab.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify and switch between credit card and cash flow views within 2 seconds of landing on the Dashboard.
- **SC-002**: Each tab displays only its designated widgets — zero content overlap between tabs.
- **SC-003**: Tab switching completes in under 100 milliseconds with no visible loading state.
- **SC-004**: The tab bar is consistent in appearance and interaction with the existing Auditoria page tabs.
- **SC-005**: All existing Dashboard functionality (pay invoice, edit transaction, AI insights, purchase simulator) remains fully operational after the reorganization.
- **SC-006**: Mobile users can access both tabs without horizontal scrolling or obscured tab labels.
