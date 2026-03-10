# Du Virtual Team — Autonomous Agent System

**Date:** 2026-03-09
**Status:** Approved
**Author:** Lucas Galhardo + Claude

## Summary

A set of five autonomous agents that run on GitHub Actions cron schedules, analyze the Du codebase, and create issues and documents in Linear. They act as a virtual team for a solo founder — covering product management, technical debt, security, UX, and branding.

## Motivation

Du is a one-person project. Features that benefit from multiple perspectives (security audits, UX reviews, roadmap planning) get skipped when you're heads-down coding. These agents provide continuous, low-noise oversight without hiring a team.

## The Team

| Agent | Cadence | Creates | Labels |
|-------|---------|---------|--------|
| PM / Discovery | Weekly (Mon 8am BRT) | Linear Documents (PRDs); one summary issue linking to docs | Area labels based on analysis |
| Tech Debt | Daily (weekdays 8am BRT) | Issues directly | `Infra` + platform labels |
| Security Auditor | Weekly (Wed 8am BRT) | Issues for vulnerabilities; document for broader recommendations | `Security` + platform labels |
| UX Reviewer | Weekly (Thu 8am BRT) | Issues for concrete problems; document for subjective proposals | `Design` + area labels |
| Brand Strategist | Bi-weekly (1st & 15th, 8am BRT) | Document with audit + recommendations | `Design` + `Landing Page` |

**Key principle:** Objective findings auto-create tickets. Subjective proposals go through Lucas as documents first.

## Architecture

```
GitHub Actions (cron schedule)
  → Node.js script (tsx)
    → Read source files (context.ts)
    → Fetch existing open issues (dedup)
    → Fetch recently rejected issues (feedback loop)
    → Send to Claude API with role-specific system prompt
    → Claude returns structured JSON
    → Create issues/documents via Linear GraphQL API
```

## File Structure

```
scripts/agents/
  lib/
    claude.ts           # Claude API client — sends prompt, returns structured JSON
    linear.ts           # Linear GraphQL client — create issue, document, search
    context.ts          # Reads source files into string context per agent
    types.ts            # Shared types (AgentResult, LinearIssue, LinearDocument)
  prompts/
    tech-debt.md        # System prompt for Tech Debt agent
    pm-discovery.md     # System prompt for PM / Discovery agent
    security.md         # System prompt for Security Auditor agent
    ux-reviewer.md      # System prompt for UX Reviewer agent
    brand-strategist.md # System prompt for Brand Strategist agent
  context/
    user-personas.md    # Shared user personas (consumed by PM, UX, Brand)
  tech-debt.ts          # Agent entry point
  pm-discovery.ts       # Agent entry point
  security.ts           # Agent entry point
  ux-reviewer.ts        # Agent entry point
  brand-strategist.ts   # Agent entry point

.github/workflows/
  agents-daily.yml      # Tech Debt (weekdays)
  agents-weekly.yml     # PM (Mon), Security (Wed), UX (Thu)
  agents-biweekly.yml   # Brand Strategist (1st & 15th)
```

## Context Strategy

Each agent reads a curated subset of the codebase relevant to its role.

| Agent | Files |
|-------|-------|
| Tech Debt | `server/**/*.ts`, `app/**/*.{vue,ts}`, `prisma/schema.prisma`, `package.json` |
| PM Discovery | `app/pages/**`, `app/components/**`, `server/api/**`, `prisma/schema.prisma`, `docs/plans/**` |
| Security | `server/**/*.ts`, `app/middleware/**`, `nuxt.config.ts`, `prisma/schema.prisma`, `.env.example` |
| UX Reviewer | `app/components/**/*.vue`, `app/pages/**/*.vue`, `app/assets/**/*.css`, `tailwind.config.js` |
| Brand Strategist | `app/pages/index.vue`, `app/assets/**/*.css`, `app/components/ui/**`, `public/**` |

The `context.ts` module handles:
- Globbing files per agent config
- Reading file contents with size limits
- Concatenating into a single context string with file path headers

For the Tech Debt agent (daily), context is scoped to files changed since the last run (`git diff --name-only`) to avoid re-analyzing the entire codebase every day. Falls back to full scan if no previous run timestamp exists.

## User Personas

A shared document at `scripts/agents/context/user-personas.md` consumed by PM, UX, and Brand agents. Contains 2-3 realistic Brazilian user profiles with financial situations, device usage, pain points, and goals.

Example persona:

```markdown
## Ana, 28, São Paulo
- Salary: R$6.500/mo, 3 credit cards (Nubank, C6, Inter)
- Heavy parcelamento user — averages 8 active installments
- Checks Du daily on mobile, weekly on desktop
- Pain points: doesn't know real monthly commitment, surprised by fatura amounts
- Goals: reduce card usage by 30% in 6 months
```

**Ownership:** The PM agent owns the persona file. It may propose persona updates in its weekly document output based on feature decisions and product direction. Other agents consume personas as-is.

## Deduplication

Before creating issues, each agent:
1. Fetches all open issues in the Du project from Linear
2. Includes their titles and descriptions in Claude's prompt
3. Claude is instructed: "Do NOT suggest issues that overlap with these existing tickets"

This prevents duplicate ticket creation across runs.

## Feedback Loop

Each agent fetches issues it created that were canceled or closed as "won't fix" in the last 30 days. These are included in the prompt as rejected suggestions. Claude is instructed: "The team lead rejected these — do not suggest similar things. Adapt your analysis accordingly."

This allows agents to self-correct over time based on Lucas's decisions.

## Weekly Digest

The PM agent's Monday run starts with a meta-analysis: it fetches all issues created by agents in the past week, checks their status (acted on, dismissed, still open), and produces a "Week of [date] — Virtual Team Summary" section at the top of its document. This gives a pulse check on agent signal-to-noise ratio.

## Structured Output

All agents return structured JSON from Claude. Schema:

```typescript
interface AgentResult {
  issues: Array<{
    title: string
    description: string       // Markdown
    labels: string[]           // Label names from our taxonomy
    priority: 0 | 1 | 2 | 3 | 4  // Linear priority values
  }>
  documents: Array<{
    title: string
    content: string            // Markdown
  }>
  summary: string              // One-line summary for GitHub Actions log
}
```

PM and Brand agents use both `issues` and `documents`. Tech Debt, Security, and UX primarily use `issues` (Security and UX may include a `documents` entry for broader recommendations).

## Dry Run Mode

Every agent script accepts a `--dry-run` flag:
- Runs the full pipeline (reads files, calls Claude, gets structured output)
- Prints issues and documents to stdout as formatted markdown
- Does NOT create anything in Linear

Usage: `npx tsx scripts/agents/tech-debt.ts --dry-run`

Essential for prompt iteration and testing.

## GitHub Actions Workflows

### Schedules (UTC, BRT = UTC-3)

| Workflow | Cron (UTC) | Agent | BRT |
|----------|-----------|-------|-----|
| `agents-daily.yml` | `0 11 * * 1-5` | Tech Debt | 8am weekdays |
| `agents-weekly.yml` | `0 11 * * 1` | PM Discovery | 8am Monday |
| `agents-weekly.yml` | `0 11 * * 3` | Security Auditor | 8am Wednesday |
| `agents-weekly.yml` | `0 11 * * 4` | UX Reviewer | 8am Thursday |
| `agents-biweekly.yml` | `0 11 1,15 * *` | Brand Strategist | 8am 1st & 15th |

### Secrets

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Claude API access |
| `LINEAR_API_KEY` | Linear Personal API Key |

### Workflow Structure

Each workflow:
1. Checks out the repo
2. Installs dependencies (`npm ci`)
3. Runs the agent script (`npx tsx scripts/agents/<agent>.ts`)
4. Logs the summary output

All workflows support `workflow_dispatch` for manual triggering.

## New Label Required

One new label under the Area group:
- **Security** (color: `#DC2626`, parent: Area)

## Dependencies

One new dev dependency:
- `@anthropic-ai/sdk` — Claude API client

No other new dependencies. Linear GraphQL calls use plain `fetch`. File reading uses Node.js `fs`. Glob uses the existing ecosystem.

## Design Decisions

1. **System prompts as markdown files** — Prompts are the soul of each agent. Keeping them in `.md` files makes iteration easy without touching TypeScript.

2. **tsx as runner** — Already a dev dependency. No build step needed. Scripts run directly.

3. **No agent memory/state** — Agents are stateless between runs. Deduplication and feedback loop use Linear as the source of truth. No database, no files to persist.

4. **Flat Linear project** — All issues go into the single Du project. Labels provide filtering. No sub-projects or separate boards.

5. **Claude model** — Use `claude-sonnet-4-6` for agents. Fast, cheap, good enough for analysis tasks. No need for Opus.
