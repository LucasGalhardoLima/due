<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (Initial ratification)

Modified principles: N/A (new constitution)

Added sections:
- Core Principles (3 principles)
  - I. Privacy-First Architecture
  - II. Intelligent AI Boundaries
  - III. Performance & Mobile Excellence
- Development Standards
- Quality Assurance

Removed sections: N/A

Templates requiring updates:
- .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
- .specify/templates/spec-template.md ✅ (No changes needed)
- .specify/templates/tasks-template.md ✅ (No changes needed)

Follow-up TODOs: None
-->

# Due Finance Constitution

## Core Principles

### I. Privacy-First Architecture

Financial data is sacred. Every feature MUST treat user data with the highest level of protection.

**Non-Negotiable Rules**:
- User data MUST be isolated by `userId` at the database level (multi-tenancy)
- Sensitive financial data MUST NOT be logged or exposed in error messages
- Authentication MUST use enterprise-grade providers (Clerk)
- API endpoints MUST validate user ownership before returning any data
- Third-party services (OpenAI) MUST NOT retain user financial data
- CSV imports and exports MUST be processed in-memory, never persisted as raw files

**Rationale**: Users trust Due with their financial information. A single data leak destroys that trust permanently. Security is not a feature—it is the foundation.

### II. Intelligent AI Boundaries

AI enhances financial decisions but MUST NOT replace user judgment or create false confidence.

**Non-Negotiable Rules**:
- AI features MUST clearly indicate when content is AI-generated
- AI recommendations MUST provide reasoning, not just conclusions
- AI MUST NOT auto-execute financial actions (e.g., auto-pay, auto-categorize without confirmation)
- AI prompts MUST NOT include raw transaction amounts or descriptions—use aggregates and patterns
- AI failures MUST degrade gracefully with clear user messaging
- Users MUST be able to override or dismiss AI suggestions

**Rationale**: Financial AI should be a copilot, not autopilot. Users remain in control of their financial decisions. AI provides insights; users make choices.

### III. Performance & Mobile Excellence

Due MUST deliver a fast, fluid experience optimized for mobile-first usage.

**Non-Negotiable Rules**:
- Dashboard MUST load initial data within 2 seconds on 4G connections
- All interactive elements MUST provide immediate visual feedback (<100ms)
- Mobile viewport MUST be the primary design target; desktop is an enhancement
- Pull-to-refresh and optimistic updates MUST be implemented for key actions
- Bundle size MUST stay under 500KB initial load (excluding images)
- Offline-capable features (viewing cached data) SHOULD be prioritized

**Rationale**: Financial management happens on the go. Users check their spending on phones while shopping, commuting, or making purchase decisions. Slow or clunky UX means users abandon the tool.

## Development Standards

**Technology Stack Alignment**:
- Frontend: Nuxt 4, Vue 3, TypeScript, Tailwind CSS
- Backend: Nuxt server routes, Prisma ORM, PostgreSQL
- Authentication: Clerk
- AI: OpenAI GPT-4o (via API, stateless)
- Validation: Zod schemas
- Testing: Vitest (unit/integration), Playwright (E2E)

**Code Quality Gates**:
- TypeScript strict mode MUST be enabled
- All API responses MUST use Zod validation
- Component props MUST be typed with TypeScript
- Database queries MUST use Prisma's type-safe client
- No `any` types except in explicitly justified migration code

## Quality Assurance

**Testing Philosophy**:
- Critical user flows (import, transaction creation, invoice viewing) MUST have E2E coverage
- API endpoints handling financial data MUST have integration tests
- Unit tests are encouraged but not mandated for UI components
- Test failures MUST block deployment

**Code Review Requirements**:
- Changes to authentication or data access patterns require explicit security review
- AI prompt changes require review for data leakage
- Database migrations require rollback strategy documentation

## Governance

This constitution supersedes all other development practices for the Due Finance project.

**Amendment Process**:
1. Propose changes via documented discussion
2. Evaluate impact on existing code and user trust
3. Update version according to semantic versioning:
   - MAJOR: Principle removal or fundamental redefinition
   - MINOR: New principle added or material expansion
   - PATCH: Clarifications and non-semantic refinements
4. Update all dependent templates and documentation

**Compliance Review**:
- All pull requests MUST verify compliance with Core Principles
- Complexity additions MUST be justified against Principle III (Performance)
- New features MUST be evaluated against all three principles before design begins

**Version**: 1.0.0 | **Ratified**: 2026-01-23 | **Last Amended**: 2026-01-23
