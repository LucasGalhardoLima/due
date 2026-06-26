<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)
  Added principles:
    - I. Privacy First
    - II. Offline Access
    - III. Data Quality
    - IV. Performance & Speed
    - V. Apple Design Language
    - VI. UI/UX Consistency
    - VII. Testing Standards
  Added sections:
    - Performance Budgets (quantitative thresholds)
    - Continuous Learning (CLAUDE.md feedback loop)
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ no changes needed (Constitution Check
      section already generic; principles will populate it per feature)
    - .specify/templates/spec-template.md — ✅ no changes needed (success criteria
      section already supports measurable outcomes aligned with these principles)
    - .specify/templates/tasks-template.md — ✅ no changes needed (phase structure
      supports testing-first and cross-cutting polish phases)
  Follow-up TODOs: none
-->

# Due iOS Constitution

## Core Principles

### I. Privacy First

Financial data is among the most sensitive information a user owns.
Every architecture and feature decision MUST treat user privacy as a
non-negotiable constraint, not a trade-off.

- All API communication MUST use HTTPS with certificate pinning in
  release builds.
- Sensitive data (tokens, account numbers, balances) MUST NOT be
  logged, printed to console, or persisted in plain text outside the
  Keychain.
- The app MUST NOT send analytics, telemetry, or crash reports that
  contain personally identifiable financial data.
- Biometric or passcode gating MUST be available for app launch and
  sensitive actions (viewing balances, confirming transactions).
- Third-party SDKs MUST be audited for data collection before
  integration. Any SDK that phones home with user data without
  explicit consent is disqualified.
- On sign-out, all cached user data MUST be wiped from disk (CoreData
  stores, Keychain entries, UserDefaults, temp files).

### II. Offline Access

Users check their finances in elevators, subways, and rural areas.
The app MUST remain useful without a network connection.

- A local persistence layer (CoreData or SwiftData) MUST cache the
  last-known state of dashboard, transactions, installments, and
  budget data.
- The app MUST launch and render cached data within 1 second, even
  when fully offline.
- Network-dependent actions (creating a transaction, syncing) MUST
  queue locally and sync when connectivity returns, using optimistic
  UI updates.
- Conflict resolution strategy: server wins for financial data; the
  app MUST surface conflicts to the user when amounts diverge.
- Offline state MUST be clearly communicated via a non-intrusive
  banner — never a blocking modal.
- Pull-to-refresh MUST gracefully degrade: show cached data with a
  "last updated" timestamp when offline.

### III. Data Quality

Incorrect financial data erodes trust instantly. Every data path MUST
guarantee correctness end-to-end.

- All API response models MUST use strict Codable conformance with
  explicit CodingKeys — no implicit key mapping.
- Currency values MUST be represented as `Decimal` (not `Double`) in
  models and view models to avoid floating-point drift.
- Date handling MUST use explicit time zones (user's local for display,
  UTC for storage/transmission). Never rely on device default.
- Every API response MUST be validated against expected schema before
  updating the UI. Malformed responses MUST be discarded with a logged
  warning, not silently accepted.
- BRL formatting MUST use `NumberFormatter` with `locale: pt_BR` —
  never string interpolation for currency display.
- Installment math (remaining count, monthly amount) MUST be computed
  server-side; the client displays but never recalculates.

### IV. Performance & Speed

A finance app that feels slow feels untrustworthy. Performance is a
feature, not an afterthought.

- **Cold launch to interactive content**: < 2 seconds on iPhone 13
  (baseline device).
- **Tab switch to rendered content**: < 300 ms (cached), < 1 second
  (network fetch).
- **Scroll frame rate**: 60 fps sustained on all supported devices
  (120 fps on ProMotion where available).
- **Memory ceiling**: < 100 MB resident memory under normal use.
- **Network payload**: individual API responses MUST be < 50 KB; batch
  endpoints < 200 KB.
- All list views MUST use `LazyVStack` or `List` — never `VStack` for
  unbounded data sets.
- Images and heavy assets MUST load asynchronously with placeholder
  shimmer states.
- Animations MUST use the `DueTheme` spring presets; custom animations
  require justification and profiling.

### V. Apple Design Language

Due MUST feel like a first-party Apple app. Deviation from platform
conventions requires explicit justification.

- Navigation MUST use `NavigationStack` with programmatic paths — no
  legacy `NavigationView`.
- System materials (`ultraThinMaterial`, `glassEffect` on iOS 26+)
  MUST be used for overlays and toolbars instead of custom blur.
- Dynamic Type MUST be supported: all text MUST use system font styles
  (`.title`, `.body`, `.caption`) or scaled custom fonts via
  `@ScaledMetric`.
- Dark Mode MUST be a first-class citizen: every color MUST be defined
  with light/dark variants using the adaptive `Color(light:dark:)`
  pattern already established in `Color+Due.swift`.
- SF Symbols MUST be the primary icon source. Custom icons require
  matching weight and optical alignment with SF Symbols.
- Haptic feedback MUST use `HapticManager` for user-initiated actions
  (taps, confirmations, errors) — never for passive state changes.
- The app MUST respect system settings: Reduce Motion, Bold Text,
  Increase Contrast, VoiceOver.
- Layout MUST use system spacing (multiples of 4pt) and the
  `DueTheme` radius constants. Arbitrary magic numbers are prohibited.

### VI. UI/UX Consistency

Every screen MUST feel like it belongs to the same app. Consistency
builds muscle memory and trust.

- All cards, lists, and containers MUST use the shared glass effect
  helpers (`View+Glass.swift`) — no one-off background treatments.
- Loading states MUST use the skeleton shimmer system (`SkeletonView`,
  `DashboardSkeleton`, etc.) — never a plain spinner for content
  areas.
- Empty states MUST use `EmptyStateView` with an illustration, message,
  and action button.
- Error states MUST use `ErrorView` with a retry action — never a
  silent failure or raw error string.
- Interactive elements MUST use `pressableStyle()` for consistent
  haptic and scale feedback.
- Color usage MUST follow the established token system: mint ramp for
  light accents, violet ramp for dark/primary accents, status colors
  for semantic meaning. Raw hex values in views are prohibited.
- Spacing between sections MUST be 16pt (standard), 12pt (compact),
  8pt (inline elements). These values MUST come from named constants,
  not literals.
- Sheet presentations MUST follow a consistent pattern: medium detent
  for quick actions, large detent for forms.

### VII. Testing Standards

Core financial functionality MUST be verified by automated tests.
Shipping a bug in money calculations is unacceptable.

- All ViewModels MUST have unit tests covering: successful data load,
  error handling, empty state, and edge cases (zero amounts, negative
  values, missing fields).
- Currency formatting MUST have dedicated tests for: BRL locale, zero,
  negative, large values (> R$ 1M), and decimal precision.
- API client MUST have tests using mock URLProtocol: success paths,
  HTTP error codes (401, 403, 404, 500), malformed JSON, and timeout.
- Offline queue (once implemented) MUST have tests for: enqueue, dequeue
  on connectivity, conflict detection, and data integrity after sync.
- Snapshot tests (optional but encouraged) for key screens: Dashboard,
  Transactions, Installments — both light and dark mode.
- Test naming convention: `test_<unit>_<scenario>_<expectedResult>` —
  e.g., `test_budgetSummary_whenOffline_returnsCachedData`.
- Tests MUST run in CI before merge. A failing test MUST block the PR.
- Minimum coverage target: 80% for ViewModels and Networking layers;
  60% for Helpers. Views are exempt from coverage requirements but
  encouraged via snapshot tests.

## Performance Budgets

Quantitative thresholds that MUST be maintained. Regressions against
these budgets MUST be caught in code review or automated profiling.

| Metric | Target | Baseline Device |
|--------|--------|-----------------|
| Cold launch → content | < 2 s | iPhone 13 |
| Tab switch (cached) | < 300 ms | iPhone 13 |
| Tab switch (network) | < 1 s | iPhone 13 |
| Scroll frame rate | 60 fps | iPhone 13 |
| Memory (normal use) | < 100 MB | iPhone 13 |
| API response size | < 50 KB | N/A |
| App binary size | < 30 MB | N/A |
| Animation jank | 0 dropped frames | iPhone 13 |

## Continuous Learning

Every mistake made during development MUST produce a durable lesson.

- When a bug is found that was caused by violating a principle in this
  constitution, the developer MUST add a "Lessons Learned" entry to
  `CLAUDE.md` under the `<!-- MANUAL ADDITIONS START -->` section.
- Each entry MUST include: date, what went wrong, which principle was
  violated, and the corrective action taken.
- Format: `- YYYY-MM-DD: [Principle N violated] — <description of
  mistake> → <corrective action>`
- The constitution itself MUST be amended if a recurring class of
  mistakes reveals a gap in the principles.
- Code review checklists MUST reference this constitution. Reviewers
  MUST flag violations by principle number (e.g., "Violates Principle
  IV: this VStack should be LazyVStack for unbounded data").

## Governance

This constitution is the highest-authority document for the Due iOS
project. All code, design decisions, and architecture choices MUST
comply with these principles.

- **Amendment process**: Any principle change MUST be documented with
  rationale, approved by the project lead, and accompanied by a
  migration plan for existing code that violates the new rule.
- **Versioning**: This constitution follows semantic versioning.
  - MAJOR: Principle removed or fundamentally redefined.
  - MINOR: New principle added or existing principle materially
    expanded.
  - PATCH: Clarification, typo fix, or non-semantic refinement.
- **Compliance review**: Every PR MUST include a self-check against
  the principles relevant to the changed files. The `Constitution
  Check` section in plan documents MUST list which principles apply
  and confirm compliance.
- **CLAUDE.md integration**: The `CLAUDE.md` file at the repository
  root MUST be kept in sync with this constitution. Technology
  decisions, code style rules, and commands listed there MUST not
  contradict these principles.

**Version**: 1.0.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
