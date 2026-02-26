# Quickstart: Dashboard Tabbed Reorganization

## Prerequisites

- Node.js and npm installed
- Project dependencies installed (`npm install`)

## Development

```bash
# Start dev server
npm run dev

# Open dashboard
open http://localhost:3000/dashboard
```

## What to Test

1. **Default tab**: Dashboard loads with "Cartao de Credito" tab active
2. **Credit Card tab content**: SummaryCards, crisis alerts, transactions, AI insights, purchase simulator, future projection all visible
3. **Cash Flow tab content**: Switch to "Fluxo de Caixa" — FreeToSpendCard, DuScoreCard, SpendingPaceChart, NetThisMonthCard, TrendingBudgetsCard, UpcomingBillsCard, SavingsGoalsWidget visible
4. **No overlap**: Verify no widget appears on both tabs
5. **Card selector**: Visible on Credit Card tab, hidden on Cash Flow tab
6. **Month navigation**: Works on both tabs, state preserved when switching
7. **Tab persistence**: Switch tabs, change month/card, switch back — state preserved
8. **Mobile**: Tab bar fits without scrolling, both tabs tappable
9. **Empty state**: If no budget data, Cash Flow tab shows single CTA
10. **Existing features**: Pay invoice, edit transaction, AI FAB, proactive advisor all still work

## Verification

```bash
npm run lint
```

## Reference

- Auditoria page tab pattern: `app/pages/audit/index.vue` (lines 352-377)
- EmptyState component: `app/components/ui/EmptyState.vue`
