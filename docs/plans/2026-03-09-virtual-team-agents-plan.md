# Du Virtual Team — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build five autonomous agents (PM, Tech Debt, Security, UX, Brand) that run on GitHub Actions cron schedules, analyze the Du codebase, and create issues/documents in Linear.

**Architecture:** Each agent is a standalone TypeScript script run via `tsx`. A shared library handles Claude API calls (structured JSON output), Linear GraphQL API calls (create issues, documents, search), and codebase file reading. System prompts live in markdown files for easy iteration. GitHub Actions workflows trigger agents on cron schedules.

**Tech Stack:** TypeScript, tsx (runner), @anthropic-ai/sdk (Claude API), Linear GraphQL API (plain fetch), Node.js fs/path/glob (file reading)

---

### Task 1: Install dependency and add agent scripts

**Files:**
- Modify: `package.json`

**Step 1: Install @anthropic-ai/sdk**

Run: `npm install -D @anthropic-ai/sdk`

**Step 2: Add agent scripts to package.json**

Add these scripts to the `"scripts"` section of `package.json`:

```json
"agent:tech-debt": "tsx scripts/agents/tech-debt.ts",
"agent:pm": "tsx scripts/agents/pm-discovery.ts",
"agent:security": "tsx scripts/agents/security.ts",
"agent:ux": "tsx scripts/agents/ux-reviewer.ts",
"agent:brand": "tsx scripts/agents/brand-strategist.ts"
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk and agent script shortcuts"
```

---

### Task 2: Create shared types

**Files:**
- Create: `scripts/agents/lib/types.ts`

**Step 1: Write types file**

```typescript
export interface AgentIssue {
  title: string
  description: string
  labels: string[]
  priority: 0 | 1 | 2 | 3 | 4
}

export interface AgentDocument {
  title: string
  content: string
}

export interface AgentResult {
  issues: AgentIssue[]
  documents: AgentDocument[]
  summary: string
}

export interface AgentConfig {
  name: string
  projectId: string
  teamId: string
  filePatterns: string[]
  promptFile: string
  includePersonas: boolean
  diffOnly?: boolean
}
```

**Step 2: Commit**

```bash
git add scripts/agents/lib/types.ts
git commit -m "feat(agents): add shared type definitions"
```

---

### Task 3: Create context builder

**Files:**
- Create: `scripts/agents/lib/context.ts`

**Step 1: Write the context builder**

This module reads source files matching glob patterns and concatenates them into a string context for Claude. It also supports diff-only mode for the Tech Debt agent.

```typescript
import { readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { execSync } from 'node:child_process'
import { glob } from 'node:fs/promises'

const ROOT = resolve(import.meta.dirname, '..', '..', '..')
const MAX_FILE_SIZE = 50_000 // 50KB per file
const MAX_TOTAL_SIZE = 400_000 // 400KB total context

export async function buildContext(
  patterns: string[],
  diffOnly: boolean = false
): Promise<string> {
  let filePaths: string[]

  if (diffOnly) {
    // Get files changed in last 24 hours on main branch
    try {
      const diff = execSync('git diff --name-only HEAD~5', {
        cwd: ROOT,
        encoding: 'utf-8',
      }).trim()
      filePaths = diff ? diff.split('\n').map((f) => resolve(ROOT, f)) : []
    } catch {
      // Fallback to full scan if git diff fails
      filePaths = await globFiles(patterns)
    }
  } else {
    filePaths = await globFiles(patterns)
  }

  let totalSize = 0
  const parts: string[] = []

  for (const filePath of filePaths) {
    if (totalSize >= MAX_TOTAL_SIZE) break

    try {
      const content = readFileSync(filePath, 'utf-8')
      if (content.length > MAX_FILE_SIZE) continue
      if (totalSize + content.length > MAX_TOTAL_SIZE) continue

      const rel = relative(ROOT, filePath)
      parts.push(`--- ${rel} ---\n${content}`)
      totalSize += content.length
    } catch {
      // Skip unreadable files
    }
  }

  return parts.join('\n\n')
}

async function globFiles(patterns: string[]): Promise<string[]> {
  const files: string[] = []
  for (const pattern of patterns) {
    for await (const entry of glob(pattern, { cwd: ROOT })) {
      files.push(resolve(ROOT, entry))
    }
  }
  // Deduplicate and sort
  return [...new Set(files)].sort()
}

export function readPrompt(promptFile: string): string {
  const path = resolve(import.meta.dirname, '..', 'prompts', promptFile)
  return readFileSync(path, 'utf-8')
}

export function readPersonas(): string {
  const path = resolve(import.meta.dirname, '..', 'context', 'user-personas.md')
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}
```

**Step 2: Commit**

```bash
git add scripts/agents/lib/context.ts
git commit -m "feat(agents): add context builder for reading source files"
```

---

### Task 4: Create Linear GraphQL client

**Files:**
- Create: `scripts/agents/lib/linear.ts`

**Step 1: Write the Linear client**

Uses plain `fetch` against `https://api.linear.app/graphql`. No extra dependencies.

```typescript
import type { AgentIssue, AgentDocument } from './types.js'

const ENDPOINT = 'https://api.linear.app/graphql'
const API_KEY = process.env.LINEAR_API_KEY

if (!API_KEY) {
  throw new Error('LINEAR_API_KEY environment variable is required')
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }

  if (json.errors?.length) {
    throw new Error(`Linear API error: ${json.errors.map((e) => e.message).join(', ')}`)
  }

  return json.data as T
}

// --- Queries ---

interface IssueNode {
  id: string
  title: string
  description: string
  state: { name: string }
  labels: { nodes: Array<{ name: string }> }
}

export async function getOpenIssues(projectId: string): Promise<IssueNode[]> {
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!) {
      project(id: $projectId) {
        issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 250) {
          nodes {
            id
            title
            description
            state { name }
            labels { nodes { name } }
          }
        }
      }
    }`,
    { projectId }
  )
  return data.project.issues.nodes
}

export async function getRejectedIssues(projectId: string): Promise<IssueNode[]> {
  // Get issues canceled in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!, $since: DateTime!) {
      project(id: $projectId) {
        issues(filter: { state: { type: { eq: "canceled" } }, canceledAt: { gte: $since } }, first: 100) {
          nodes {
            id
            title
            description
            state { name }
            labels { nodes { name } }
          }
        }
      }
    }`,
    { projectId, since: thirtyDaysAgo }
  )
  return data.project.issues.nodes
}

export async function getLabelIds(names: string[]): Promise<Record<string, string>> {
  const data = await graphql<{
    issueLabels: { nodes: Array<{ id: string; name: string }> }
  }>(
    `query {
      issueLabels(first: 100) {
        nodes { id name }
      }
    }`
  )

  const map: Record<string, string> = {}
  for (const label of data.issueLabels.nodes) {
    if (names.includes(label.name)) {
      map[label.name] = label.id
    }
  }
  return map
}

export async function createIssue(
  issue: AgentIssue,
  teamId: string,
  projectId: string,
  labelMap: Record<string, string>
): Promise<{ id: string; identifier: string }> {
  const labelIds = issue.labels
    .map((name) => labelMap[name])
    .filter(Boolean)

  const data = await graphql<{
    issueCreate: { success: boolean; issue: { id: string; identifier: string } }
  }>(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier }
      }
    }`,
    {
      input: {
        title: issue.title,
        description: issue.description,
        teamId,
        projectId,
        priority: issue.priority,
        labelIds,
      },
    }
  )

  return data.issueCreate.issue
}

export async function createDocument(
  doc: AgentDocument,
  projectId: string
): Promise<{ id: string }> {
  const data = await graphql<{
    documentCreate: { success: boolean; document: { id: string } }
  }>(
    `mutation($input: DocumentCreateInput!) {
      documentCreate(input: $input) {
        success
        document { id }
      }
    }`,
    {
      input: {
        title: doc.title,
        content: doc.content,
        projectId,
      },
    }
  )

  return data.documentCreate.document
}
```

**Step 2: Commit**

```bash
git add scripts/agents/lib/linear.ts
git commit -m "feat(agents): add Linear GraphQL client"
```

---

### Task 5: Create Claude API client

**Files:**
- Create: `scripts/agents/lib/claude.ts`

**Step 1: Write the Claude client**

Uses `@anthropic-ai/sdk` to send a system prompt + user context and get back structured JSON.

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { AgentResult } from './types.js'

const client = new Anthropic()

const RESULT_SCHEMA = {
  type: 'object' as const,
  properties: {
    issues: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          description: { type: 'string' as const },
          labels: { type: 'array' as const, items: { type: 'string' as const } },
          priority: { type: 'number' as const, enum: [0, 1, 2, 3, 4] },
        },
        required: ['title', 'description', 'labels', 'priority'],
      },
    },
    documents: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          content: { type: 'string' as const },
        },
        required: ['title', 'content'],
      },
    },
    summary: { type: 'string' as const },
  },
  required: ['issues', 'documents', 'summary'],
}

export async function analyzeWithClaude(
  systemPrompt: string,
  userContent: string
): Promise<AgentResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
    tools: [
      {
        name: 'submit_analysis',
        description: 'Submit the analysis results as structured data',
        input_schema: RESULT_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_analysis' },
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured output')
  }

  return toolUse.input as AgentResult
}
```

**Step 2: Commit**

```bash
git add scripts/agents/lib/claude.ts
git commit -m "feat(agents): add Claude API client with structured output"
```

---

### Task 6: Create agent runner

**Files:**
- Create: `scripts/agents/lib/runner.ts`

**Step 1: Write the shared runner**

This is the main orchestration logic shared by all agents. It reads context, fetches Linear state, calls Claude, and creates issues/documents (or prints them in dry-run mode).

```typescript
import 'dotenv/config'
import type { AgentConfig, AgentResult } from './types.js'
import { buildContext, readPrompt, readPersonas } from './context.js'
import { analyzeWithClaude } from './claude.js'
import {
  getOpenIssues,
  getRejectedIssues,
  getLabelIds,
  createIssue,
  createDocument,
} from './linear.js'

export async function runAgent(config: AgentConfig): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  console.log(`\n🤖 Running ${config.name} agent${dryRun ? ' (DRY RUN)' : ''}...\n`)

  // 1. Build codebase context
  console.log('📂 Reading source files...')
  const codeContext = await buildContext(config.filePatterns, config.diffOnly)
  if (!codeContext.trim()) {
    console.log('No relevant files found. Skipping.')
    return
  }

  // 2. Read system prompt
  const systemPrompt = readPrompt(config.promptFile)

  // 3. Read personas if needed
  const personas = config.includePersonas ? readPersonas() : ''

  // 4. Fetch existing open issues for deduplication
  console.log('🔍 Fetching existing Linear issues...')
  const openIssues = await getOpenIssues(config.projectId)
  const rejectedIssues = await getRejectedIssues(config.projectId)

  // 5. Build user message
  const userMessage = buildUserMessage(codeContext, personas, openIssues, rejectedIssues)

  // 6. Call Claude
  console.log('🧠 Analyzing with Claude...')
  const result = await analyzeWithClaude(systemPrompt, userMessage)

  // 7. Output results
  if (dryRun) {
    printDryRun(result)
  } else {
    await createInLinear(result, config)
  }

  console.log(`\n✅ ${config.name}: ${result.summary}`)
}

function buildUserMessage(
  codeContext: string,
  personas: string,
  openIssues: Array<{ title: string; description: string }>,
  rejectedIssues: Array<{ title: string; description: string }>
): string {
  const parts: string[] = []

  parts.push('## Codebase\n\n' + codeContext)

  if (personas) {
    parts.push('## User Personas\n\n' + personas)
  }

  if (openIssues.length > 0) {
    const issueList = openIssues
      .map((i) => `- ${i.title}`)
      .join('\n')
    parts.push(
      '## Existing Open Issues (DO NOT duplicate these)\n\n' + issueList
    )
  }

  if (rejectedIssues.length > 0) {
    const rejectedList = rejectedIssues
      .map((i) => `- ${i.title}: ${i.description?.slice(0, 100) || ''}`)
      .join('\n')
    parts.push(
      '## Recently Rejected Issues (DO NOT suggest similar)\n\n' + rejectedList
    )
  }

  return parts.join('\n\n---\n\n')
}

function printDryRun(result: AgentResult): void {
  console.log('\n--- DRY RUN OUTPUT ---\n')

  if (result.issues.length > 0) {
    console.log(`📋 Issues (${result.issues.length}):\n`)
    for (const issue of result.issues) {
      console.log(`  [P${issue.priority}] ${issue.title}`)
      console.log(`  Labels: ${issue.labels.join(', ')}`)
      console.log(`  ${issue.description.slice(0, 200)}...`)
      console.log()
    }
  }

  if (result.documents.length > 0) {
    console.log(`📄 Documents (${result.documents.length}):\n`)
    for (const doc of result.documents) {
      console.log(`  ${doc.title}`)
      console.log(`  ${doc.content.slice(0, 200)}...`)
      console.log()
    }
  }
}

async function createInLinear(result: AgentResult, config: AgentConfig): Promise<void> {
  // Collect all label names from issues
  const allLabels = [...new Set(result.issues.flatMap((i) => i.labels))]
  const labelMap = await getLabelIds(allLabels)

  // Create issues
  for (const issue of result.issues) {
    const created = await createIssue(issue, config.teamId, config.projectId, labelMap)
    console.log(`  ✅ Created issue: ${created.identifier} — ${issue.title}`)
  }

  // Create documents
  for (const doc of result.documents) {
    const created = await createDocument(doc, config.projectId)
    console.log(`  📄 Created document: ${doc.title} (${created.id})`)
  }
}
```

**Step 2: Commit**

```bash
git add scripts/agents/lib/runner.ts
git commit -m "feat(agents): add shared agent runner with dry-run support"
```

---

### Task 7: Create user personas

**Files:**
- Create: `scripts/agents/context/user-personas.md`

**Step 1: Write personas file**

```markdown
# Du — User Personas

These personas represent the target users of Du. They are used by the PM, UX, and Brand agents to ground analysis in real user needs.

---

## Ana, 28, São Paulo — The Parcelamento Queen

- **Job:** Marketing analyst at a startup
- **Income:** R$6.500/mo
- **Cards:** Nubank (limit R$12k), C6 Bank (limit R$5k), Inter (limit R$3k)
- **Behavior:** Heavy parcelamento user — averages 8 active installments at any time. Buys everything in 3-12x. Checks Du daily on mobile during commute, weekly on desktop for deeper review.
- **Pain points:**
  - Doesn't know her real monthly commitment across all cards
  - Gets surprised by fatura amounts when parcelas overlap
  - Loses track of which parcelas end when
  - Feels guilty about spending but can't visualize the impact
- **Goals:** Reduce card usage by 30% in 6 months. Wants to feel "in control" of her finances without a rigid budget.
- **Device:** iPhone 14, uses mobile 90% of the time

---

## Carlos, 35, Belo Horizonte — The Family Provider

- **Job:** Civil engineer, stable salary
- **Income:** R$11.000/mo
- **Cards:** Itaú Platinum (limit R$20k), Nubank (limit R$8k)
- **Behavior:** Uses credit cards for everything to accumulate points. Wife also has authorized cards. Monthly expenses around R$7-9k across both cards. Reviews finances on weekends.
- **Pain points:**
  - Two people spending on same cards makes tracking hard
  - Needs to separate personal vs. family expenses
  - Wants to know if he can afford a big purchase without breaking next month's budget
  - Hates spreadsheets but knows he needs to track spending
- **Goals:** Keep monthly card spending under R$8k. Save for a family vacation (R$15k target).
- **Device:** Samsung Galaxy S24, prefers desktop for financial reviews

---

## Beatriz, 22, Recife — The Student

- **Job:** Part-time intern + freelance design work
- **Income:** R$2.800/mo (variable)
- **Cards:** Nubank (limit R$2k, her first card)
- **Behavior:** New to credit cards. Uses parcelamento for everything because she can't pay upfront. Scared of debt. Checks her app anxiously multiple times a day.
- **Pain points:**
  - Doesn't understand how parcelamento interest works
  - Afraid of fatura shock — the total is always higher than expected
  - Needs simple, clear language — not financial jargon
  - Variable income makes budgeting hard
- **Goals:** Build credit responsibly. Never pay minimum payment. Understand what she owes at all times.
- **Device:** iPhone SE, always on mobile
```

**Step 2: Commit**

```bash
git add scripts/agents/context/user-personas.md
git commit -m "feat(agents): add user personas for PM, UX, and Brand agents"
```

---

### Task 8: Create system prompts

**Files:**
- Create: `scripts/agents/prompts/tech-debt.md`
- Create: `scripts/agents/prompts/pm-discovery.md`
- Create: `scripts/agents/prompts/security.md`
- Create: `scripts/agents/prompts/ux-reviewer.md`
- Create: `scripts/agents/prompts/brand-strategist.md`

**Step 1: Write tech-debt.md**

```markdown
# Tech Debt Agent — System Prompt

You are a senior software engineer reviewing the Du codebase for technical debt, code quality issues, and maintainability problems.

## About Du

Du is a personal finance app for credit-card-first users in Brazil. Built with Nuxt 4 (Vue 3), Prisma, TypeScript, and a native iOS app in Swift/SwiftUI.

## Your Scope

Analyze the provided source code and identify:

1. **Code smells** — duplicated logic, overly complex functions, deep nesting, long files
2. **Type safety** — missing types, `any` usage, unsafe casts, Decimal type misuse
3. **Missing tests** — untested business logic, especially financial calculations
4. **Dead code** — unused exports, unreachable branches, orphaned files
5. **Dependency issues** — outdated packages, unused dependencies, security advisories
6. **TODO/FIXME/HACK comments** — unresolved items left in code
7. **Performance** — N+1 queries, missing indexes, unnecessary re-renders, large bundle imports
8. **Error handling** — swallowed errors, missing try/catch on async operations

## Rules

- Only report issues you can see evidence of in the provided code
- Be specific: include file paths and line references
- Prioritize issues by impact: P1 (Urgent) for data integrity/security, P2 (High) for bugs, P3 (Medium) for maintainability, P4 (Low) for style
- Each issue should be actionable — describe what to fix, not just what's wrong
- Do NOT suggest refactors that are purely stylistic preferences
- Do NOT suggest adding documentation or comments unless code is genuinely confusing

## Labels

Assign labels from this taxonomy:
- Platform: `Web`, `iOS`, `Backend`
- Area: `Infra` (always include), plus any relevant area label: `Dashboard`, `Transactions`, `Cards`, `Budget`, `AI Advisor`, `Auth`, `Landing Page`

## Output

Use the submit_analysis tool to return your findings as structured JSON.
```

**Step 2: Write pm-discovery.md**

```markdown
# PM / Discovery Agent — System Prompt

You are a product manager for Du, a personal finance app for credit-card-first users in Brazil. Your job is to analyze the current state of the product and propose features that would meaningfully improve users' financial lives.

## About Du

Du helps users track credit card spending, installments (parcelamento), invoices (faturas), and budgets. It's built for the Brazilian market where credit card installment purchases are the norm.

## Your Scope

1. **Gap analysis** — Look at the data model, existing pages, and API routes. What capabilities exist in the backend but have no UI? What user flows are incomplete?
2. **User needs** — Based on the personas provided, what pain points are unaddressed? What features would make the biggest difference in their daily financial lives?
3. **Competitive awareness** — Consider what apps like Mobills, Organizze, and Guiabolso offer that Du doesn't. But don't copy — find Du's unique angle.
4. **Feature proposals** — Propose 2-3 concrete features with clear user value. Each proposal should include: problem statement, proposed solution, success criteria, and estimated complexity (small/medium/large).

## Rules

- Think like a PM, not an engineer. Focus on user outcomes, not technical implementation.
- Proposals go into documents, NOT tickets. The team lead reviews and decides what to build.
- Be opinionated — recommend your #1 pick and explain why.
- Consider the personas carefully. Features should serve real user needs, not hypothetical ones.
- A weekly summary issue should link to your document(s).
- Start your document with a "Weekly Digest" section summarizing what the virtual team produced last week (based on existing open issues).

## Labels

For the summary issue, assign relevant area labels from: `Dashboard`, `Transactions`, `Cards`, `Budget`, `AI Advisor`, `Auth`, `Landing Page`, `Infra`

## Output

Use the submit_analysis tool to return your findings as structured JSON. Put feature proposals in `documents`. Create one summary `issue` linking to the documents.
```

**Step 3: Write security.md**

```markdown
# Security Auditor Agent — System Prompt

You are a security engineer auditing the Du codebase for vulnerabilities.

## About Du

Du is a personal finance app handling sensitive financial data — credit card details, transaction history, income data. It uses Clerk for authentication, Prisma for database access, Stripe for payments, and runs on Vercel.

## Your Scope

1. **API security** — Missing auth middleware on server routes, unvalidated inputs, injection risks via Prisma raw queries, IDOR (accessing other users' data)
2. **Data exposure** — PII in logs or error messages, sensitive fields in API responses, overly permissive CORS, secrets in client-side code
3. **Authentication & authorization** — Clerk token validation gaps, missing userId checks on queries, session handling issues
4. **Stripe security** — Webhook signature verification, idempotency handling, price ID validation
5. **Input validation** — Missing Zod schemas on API inputs, type coercion issues, file upload risks
6. **Dependencies** — Known CVEs in npm packages (check package.json versions)
7. **iOS specifics** — Keychain usage, certificate pinning, PII in UserDefaults or logs
8. **Configuration** — Insecure defaults in nuxt.config.ts, exposed debug endpoints, missing security headers

## Rules

- Only report issues you can see evidence of in the provided code
- Be specific: include file paths and describe the vulnerability
- Use OWASP categories where applicable
- Priority: P1 (Urgent) for exploitable vulnerabilities, P2 (High) for data exposure risks, P3 (Medium) for defense-in-depth gaps, P4 (Low) for hardening suggestions
- Include remediation steps for each finding
- If a file handles financial data or PII, scrutinize it extra carefully
- Create a document for broader security recommendations that don't map to specific tickets

## Labels

Assign labels from this taxonomy:
- Platform: `Web`, `iOS`, `Backend`
- Area: `Security` (always include), plus relevant: `Auth`, `Infra`, `Transactions`, `Cards`

## Output

Use the submit_analysis tool to return your findings as structured JSON.
```

**Step 4: Write ux-reviewer.md**

```markdown
# UX Reviewer Agent — System Prompt

You are a UX engineer reviewing the Du frontend for usability, accessibility, and interaction quality.

## About Du

Du is a personal finance app for credit-card-first users in Brazil. The frontend uses Vue 3 (Nuxt 4), Tailwind CSS, shadcn-vue components, and Lucide icons. It supports dark mode and has a glass-effect design system.

## Your Scope

1. **Accessibility** — Missing ARIA labels, poor contrast ratios, keyboard navigation gaps, missing focus indicators, screen reader issues
2. **Component consistency** — Inconsistent use of design system tokens, components that don't follow established patterns (glass cards, status colors, button variants)
3. **Responsive design** — Layout breaks at different breakpoints, touch targets too small on mobile, missing mobile-specific interactions
4. **Interaction patterns** — Missing loading states, no error states, jarring transitions, missing confirmation dialogs for destructive actions
5. **Information architecture** — Confusing navigation, too much information density, unclear hierarchy, missing empty states
6. **Reuse opportunities** — Duplicated UI patterns that should be extracted into shared components

## Rules

- Only report issues you can see evidence of in the provided code
- Be specific: include component file paths and describe the issue
- Consider the personas — Ana (mobile-first, daily user), Carlos (desktop weekend reviewer), Beatriz (anxious, needs clarity)
- Concrete issues (a11y violations, broken layouts) → create issues
- Subjective improvements (layout suggestions, flow ideas) → put in a document
- Priority: P2 (High) for a11y violations, P3 (Medium) for consistency issues, P4 (Low) for polish

## Labels

Assign labels from this taxonomy:
- Platform: `Web`, `iOS`
- Area: `Design` (always include), plus relevant: `Dashboard`, `Transactions`, `Cards`, `Budget`

## Output

Use the submit_analysis tool to return your findings as structured JSON.
```

**Step 5: Write brand-strategist.md**

```markdown
# Brand Strategist Agent — System Prompt

You are a brand strategist auditing Du's visual identity, voice, and positioning.

## About Du

Du (formerly "Due") is a personal finance app for credit-card-first users in Brazil. The name is a play on the Portuguese nickname (short for Eduardo) and the English word "due." The brand uses mint (#D6FFF6) as primary color, deep purple (#231651) as secondary, Sora for display text, and Manrope for body text.

## Your Scope

1. **Visual identity consistency** — Are colors, typography, spacing, and component styles consistent across the landing page, dashboard, and all screens? Does the glass effect design system feel cohesive?
2. **Brand voice** — Is the copy consistent in tone? Is Du playful, professional, friendly-expert, or something else? Does the language feel natural in Brazilian Portuguese?
3. **Positioning** — How does Du differentiate from Mobills, Organizze, Guiabolso, and bank apps? Is the "credit-card-first" positioning clear?
4. **User-facing copy** — Button labels, empty states, error messages, onboarding text — do they feel like they come from the same personality?
5. **Landing page** — Does it clearly communicate what Du is, who it's for, and why someone should use it?
6. **Logo & assets** — Is the logo usage consistent? Does the squircle shape work at all sizes?

## Rules

- You are reviewing brand, not code quality or functionality
- Be specific about what's inconsistent and propose what consistency should look like
- Reference the personas to ground your suggestions in who Du speaks to
- All findings go into a document — brand work is inherently subjective and needs human review
- Include concrete "before/after" copy suggestions where relevant
- Consider both web and iOS surfaces

## Labels

Assign labels from this taxonomy:
- Area: `Design`, `Landing Page`

## Output

Use the submit_analysis tool to return your findings as structured JSON. Prefer documents over issues — brand recommendations need discussion, not just tickets.
```

**Step 6: Commit**

```bash
git add scripts/agents/prompts/
git commit -m "feat(agents): add system prompts for all five agents"
```

---

### Task 9: Create agent entry points

**Files:**
- Create: `scripts/agents/tech-debt.ts`
- Create: `scripts/agents/pm-discovery.ts`
- Create: `scripts/agents/security.ts`
- Create: `scripts/agents/ux-reviewer.ts`
- Create: `scripts/agents/brand-strategist.ts`

**Step 1: Write tech-debt.ts**

```typescript
import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Tech Debt',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'server/**/*.ts',
    'app/**/*.vue',
    'app/**/*.ts',
    'prisma/schema.prisma',
    'package.json',
  ],
  promptFile: 'tech-debt.md',
  includePersonas: false,
  diffOnly: true,
}).catch((err) => {
  console.error('❌ Tech Debt agent failed:', err)
  process.exit(1)
})
```

**Step 2: Write pm-discovery.ts**

```typescript
import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'PM / Discovery',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'app/pages/**/*.vue',
    'app/components/**/*.vue',
    'server/api/**/*.ts',
    'prisma/schema.prisma',
    'docs/plans/**/*.md',
  ],
  promptFile: 'pm-discovery.md',
  includePersonas: true,
}).catch((err) => {
  console.error('❌ PM / Discovery agent failed:', err)
  process.exit(1)
})
```

**Step 3: Write security.ts**

```typescript
import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Security Auditor',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'server/**/*.ts',
    'app/middleware/**/*.ts',
    'nuxt.config.ts',
    'prisma/schema.prisma',
    '.env.example',
  ],
  promptFile: 'security.md',
  includePersonas: false,
}).catch((err) => {
  console.error('❌ Security Auditor agent failed:', err)
  process.exit(1)
})
```

**Step 4: Write ux-reviewer.ts**

```typescript
import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'UX Reviewer',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'app/components/**/*.vue',
    'app/pages/**/*.vue',
    'app/assets/**/*.css',
    'tailwind.config.js',
  ],
  promptFile: 'ux-reviewer.md',
  includePersonas: true,
}).catch((err) => {
  console.error('❌ UX Reviewer agent failed:', err)
  process.exit(1)
})
```

**Step 5: Write brand-strategist.ts**

```typescript
import { runAgent } from './lib/runner.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

runAgent({
  name: 'Brand Strategist',
  projectId: PROJECT_ID,
  teamId: TEAM_ID,
  filePatterns: [
    'app/pages/index.vue',
    'app/assets/**/*.css',
    'app/components/ui/**/*.vue',
    'public/**',
  ],
  promptFile: 'brand-strategist.md',
  includePersonas: true,
}).catch((err) => {
  console.error('❌ Brand Strategist agent failed:', err)
  process.exit(1)
})
```

**Step 6: Commit**

```bash
git add scripts/agents/tech-debt.ts scripts/agents/pm-discovery.ts scripts/agents/security.ts scripts/agents/ux-reviewer.ts scripts/agents/brand-strategist.ts
git commit -m "feat(agents): add entry points for all five agents"
```

---

### Task 10: Create GitHub Actions workflows

**Files:**
- Create: `.github/workflows/agents-daily.yml`
- Create: `.github/workflows/agents-weekly.yml`
- Create: `.github/workflows/agents-biweekly.yml`

**Step 1: Write agents-daily.yml**

```yaml
name: "Agent: Tech Debt (Daily)"

on:
  schedule:
    - cron: "0 11 * * 1-5" # 8am BRT weekdays
  workflow_dispatch:

jobs:
  tech-debt:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 10 # Needed for git diff

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Run Tech Debt agent
        run: npx tsx scripts/agents/tech-debt.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

**Step 2: Write agents-weekly.yml**

```yaml
name: "Agents: Weekly (PM, Security, UX)"

on:
  schedule:
    - cron: "0 11 * * 1" # Monday 8am BRT — PM
    - cron: "0 11 * * 3" # Wednesday 8am BRT — Security
    - cron: "0 11 * * 4" # Thursday 8am BRT — UX
  workflow_dispatch:
    inputs:
      agent:
        description: "Which agent to run"
        required: true
        type: choice
        options:
          - pm
          - security
          - ux
          - all

jobs:
  pm-discovery:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    if: >-
      github.event_name == 'workflow_dispatch' && (github.event.inputs.agent == 'pm' || github.event.inputs.agent == 'all')
      || github.event_name == 'schedule' && github.event.schedule == '0 11 * * 1'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Run PM / Discovery agent
        run: npx tsx scripts/agents/pm-discovery.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}

  security:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    if: >-
      github.event_name == 'workflow_dispatch' && (github.event.inputs.agent == 'security' || github.event.inputs.agent == 'all')
      || github.event_name == 'schedule' && github.event.schedule == '0 11 * * 3'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Run Security Auditor agent
        run: npx tsx scripts/agents/security.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}

  ux-reviewer:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    if: >-
      github.event_name == 'workflow_dispatch' && (github.event.inputs.agent == 'ux' || github.event.inputs.agent == 'all')
      || github.event_name == 'schedule' && github.event.schedule == '0 11 * * 4'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Run UX Reviewer agent
        run: npx tsx scripts/agents/ux-reviewer.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

**Step 3: Write agents-biweekly.yml**

```yaml
name: "Agent: Brand Strategist (Bi-weekly)"

on:
  schedule:
    - cron: "0 11 1,15 * *" # 8am BRT on 1st and 15th
  workflow_dispatch:

jobs:
  brand-strategist:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Run Brand Strategist agent
        run: npx tsx scripts/agents/brand-strategist.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LINEAR_API_KEY: ${{ secrets.LINEAR_API_KEY }}
```

**Step 4: Commit**

```bash
git add .github/workflows/
git commit -m "feat(agents): add GitHub Actions workflows for all agents"
```

---

### Task 11: Test locally with dry run

**Step 1: Run tech-debt agent in dry-run mode**

Run: `npx tsx scripts/agents/tech-debt.ts --dry-run`

Expected: The script reads source files, calls Claude API, and prints proposed issues to stdout without creating anything in Linear.

**Step 2: Verify output format**

Check that the output shows:
- Issue titles with priority levels
- Label assignments
- Description previews
- No Linear API calls made

**Step 3: Run one more agent to validate**

Run: `npx tsx scripts/agents/security.ts --dry-run`

Expected: Similar structured output with security-focused findings.

**Step 4: Fix any issues found during testing**

Address any runtime errors (import paths, missing env vars, API format issues).

---

### Task 12: Add GitHub secrets and do a live test

**Step 1: Add secrets to the repository**

Run:
```bash
gh secret set ANTHROPIC_API_KEY
gh secret set LINEAR_API_KEY
```

(These will prompt for the secret values interactively.)

**Step 2: Trigger a manual workflow run**

Run: `gh workflow run "Agent: Tech Debt (Daily)"`

**Step 3: Watch the run**

Run: `gh run watch`

Expected: The workflow completes successfully, and a new issue appears in the Du project in Linear.

**Step 4: Verify in Linear**

Check that the created issue has:
- Correct project assignment (Du)
- Correct labels (Infra + platform)
- Meaningful title and description
- Appropriate priority

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(agents): address issues found during live testing"
```

---

Plan complete and saved to `docs/plans/2026-03-09-virtual-team-agents-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints

Which approach?