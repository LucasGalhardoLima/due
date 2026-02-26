# Research: Dashboard Tabbed Reorganization

**Date**: 2026-02-26

## Summary

Minimal research needed — this is a frontend-only UI refactor with no new dependencies, APIs, or data model changes.

## Decision 1: Tab switching mechanism

**Decision**: Use `v-show` (CSS display toggle)
**Rationale**: The Auditoria page already uses this pattern (`v-show="activeTab === '...'"`) for its 3 tabs. It keeps DOM alive, avoids re-mounting components, and preserves all reactive state. All data is fetched once on mount regardless of active tab.
**Alternatives considered**:
- `v-if` / `v-else-if`: Would destroy and recreate DOM on every switch, triggering component lifecycle hooks and potentially re-fetching data. Unnecessary overhead for this use case.
- Vue Router sub-routes (`/dashboard/card`, `/dashboard/cashflow`): Would add URL-based navigation but requires restructuring into nested routes. Over-engineering for a simple content toggle.

## Decision 2: Tab bar implementation

**Decision**: Inline HTML/CSS matching the Auditoria page pattern exactly (pill-style segmented control)
**Rationale**: The Auditoria page has a proven, tested tab bar implementation. Copying the exact HTML structure and Tailwind classes ensures visual consistency with zero design risk.
**Alternatives considered**:
- Extract a reusable `TabBar` component: Could be done later if a 3rd page needs tabs, but premature for just 2 pages. YAGNI.
- shadcn-vue Tabs component: Would add a dependency on reka-ui's tab primitives. The current inline approach is simpler and already established in the codebase.

## Decision 3: Empty state for Fluxo de Caixa

**Decision**: Reuse existing `EmptyState.vue` component with CTA to `/orcamento`
**Rationale**: The component already exists and is used throughout the app (cards page, audit page). It accepts `icon`, `title`, `description`, and `action-label`/`action-to` props. No new component needed.
**Alternatives considered**:
- Custom empty state with illustrations: Would require design work and new assets. Out of scope for this refactor.
