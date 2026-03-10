import 'dotenv/config'
import type { AgentResult } from './lib/types.js'
import { buildContext, readPrompt, readPersonas } from './lib/context.js'
import { analyzeWithClaude } from './lib/claude.js'
import {
  getOpenIssues,
  getWorkflowStates,
  updateIssueState,
  addIssueComment,
} from './lib/linear.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

// Max tickets to promote to Todo per sprint planning session
const MAX_TICKETS_PER_SPRINT = 5

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log(`\n📋 Sprint Planner${dryRun ? ' (DRY RUN)' : ''}...\n`)

  // 1. Get current board state
  console.log('🔍 Fetching board state...')
  const issues = await getOpenIssues(PROJECT_ID)

  const backlog = issues.filter((i) => i.state.name === 'Backlog' || i.state.name === 'Triage')
  const todo = issues.filter((i) => i.state.name === 'Todo' || i.state.name === 'Ready')
  const inProgress = issues.filter((i) => i.state.name === 'In Progress')
  const inReview = issues.filter((i) => i.state.name === 'In Review')

  console.log(`   Backlog: ${backlog.length} | Todo: ${todo.length} | In Progress: ${inProgress.length} | In Review: ${inReview.length}`)

  // Don't overload — if there's already enough in Todo + In Progress, skip
  const activeWork = todo.length + inProgress.length
  if (activeWork >= MAX_TICKETS_PER_SPRINT) {
    console.log(`\n✅ Team has enough active work (${activeWork} tickets). Skipping sprint planning.`)
    return
  }

  const slotsAvailable = MAX_TICKETS_PER_SPRINT - activeWork

  if (backlog.length === 0) {
    console.log('\n✅ Backlog is empty. Nothing to plan.')
    return
  }

  // 2. Use Claude to prioritize the backlog
  console.log('🧠 Analyzing backlog for sprint planning...')

  const systemPrompt = `You are the sprint planner for Du, a personal finance app for credit-card-first users in Brazil.

Your job is to review the current backlog and decide which tickets should be worked on this sprint. You are NOT creating new tickets — you are triaging existing ones.

## Rules

- Select up to ${slotsAvailable} tickets from the backlog to promote to "Todo" (ready for development).
- Prioritize by: (1) urgency/severity, (2) user impact, (3) strategic alignment, (4) dependency order.
- Consider what's already in progress — don't promote tickets that conflict with or duplicate active work.
- Consider the personas: Ana (mobile-first daily user), Carlos (desktop weekend reviewer), Beatriz (anxious student).
- Be selective. It's better to ship 3 things well than start 6 things.
- P1 (Urgent) tickets should almost always be promoted.
- P4 (Low) tickets should rarely be promoted unless the backlog is empty.

## Output

Use the submit_analysis tool. For each ticket you want to promote, create an "issue" with:
- title: the exact ticket identifier (e.g., "LUM-14")
- description: One sentence explaining why you're prioritizing this ticket this sprint.
- labels: ["sprint-promoted"]
- priority: keep the original priority

Also create one "document" with your sprint planning rationale — what the team should focus on this week and why.`

  const backlogSummary = backlog.map((i) => {
    const labels = i.labels.nodes.map((l) => l.name).join(', ')
    return `- **${i.identifier}** [P${i.priority}] ${i.title} (${labels})\n  ${i.description?.slice(0, 200) || '(no description)'}`
  }).join('\n')

  const activeSummary = [...todo, ...inProgress, ...inReview].map((i) => {
    return `- **${i.identifier}** [${i.state.name}] ${i.title}`
  }).join('\n')

  const userMessage = `## Current Backlog (${backlog.length} tickets)\n\n${backlogSummary}\n\n## Already Active (${activeWork} tickets)\n\n${activeSummary || '(none)'}\n\n## Available Slots: ${slotsAvailable}`

  const result = await analyzeWithClaude(systemPrompt, userMessage)

  // 3. Promote selected tickets
  if (dryRun) {
    console.log('\n--- DRY RUN: Sprint Plan ---\n')
    for (const issue of result.issues) {
      console.log(`  ✅ Promote: ${issue.title} — ${issue.description}`)
    }
    if (result.documents.length > 0) {
      console.log(`\n📄 Sprint Rationale:\n${result.documents[0].content.slice(0, 500)}...`)
    }
  } else {
    const states = await getWorkflowStates(TEAM_ID)
    const todoStateId = states.find((s) => s.name === 'Todo')?.id

    if (!todoStateId) {
      console.error('❌ Could not find "Todo" state.')
      process.exit(1)
    }

    for (const promoted of result.issues) {
      const ticket = backlog.find((b) => b.identifier === promoted.title)
      if (!ticket) {
        console.log(`  ⚠️  ${promoted.title} not found in backlog, skipping`)
        continue
      }

      await updateIssueState(ticket.id, todoStateId)
      await addIssueComment(ticket.id, `📋 **Sprint Planner:** Promoted to Todo for this sprint.\n\n_Reason: ${promoted.description}_`)
      console.log(`  ✅ Promoted: ${ticket.identifier} — ${ticket.title}`)
    }
  }

  console.log(`\n✅ Sprint planning complete.`)
}

main().catch((err) => {
  console.error('❌ Sprint Planner failed:', err)
  process.exit(1)
})
