import 'dotenv/config'
import { execSync } from 'node:child_process'
import {
  getReadyTickets,
  getWorkflowStates,
  updateIssueState,
  addIssueComment,
  addLabelToIssue,
} from './lib/linear.js'
import type { IssueNode } from './lib/linear.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const ticketId = process.argv.find((a) => a.startsWith('--ticket='))?.split('=')[1]

  console.log(`\n🤖 Dev Agent${dryRun ? ' (DRY RUN)' : ''}...\n`)

  // 1. Get workflow states for this team
  console.log('📋 Fetching workflow states...')
  const states = await getWorkflowStates(TEAM_ID)
  const stateMap = Object.fromEntries(states.map((s) => [s.name, s.id]))
  const inProgressStateId = stateMap['In Progress']
  const inReviewStateId = stateMap['In Review'] || stateMap['Done']

  if (!inProgressStateId) {
    console.error('❌ Could not find "In Progress" state. Available:', states.map((s) => s.name).join(', '))
    process.exit(1)
  }

  // 2. Pick a ticket
  let ticket: IssueNode | undefined

  if (ticketId) {
    const tickets = await getReadyTickets(PROJECT_ID)
    ticket = tickets.find((t) => t.identifier === ticketId)
    if (!ticket) {
      console.log(`❌ Ticket ${ticketId} not found in ready state.`)
      process.exit(1)
    }
  } else {
    console.log('🔍 Looking for ready tickets...')
    const tickets = await getReadyTickets(PROJECT_ID)
    if (tickets.length === 0) {
      console.log('✅ No tickets in Todo/Ready state. Nothing to do.')
      return
    }
    ticket = tickets[0]
    console.log(`📌 Found ${tickets.length} ready ticket(s). Picking highest priority.`)
  }

  console.log(`\n🎫 Working on: ${ticket.identifier} — ${ticket.title}`)
  console.log(`   Priority: P${ticket.priority} | State: ${ticket.state.name}`)
  console.log(`   Labels: ${ticket.labels.nodes.map((l) => l.name).join(', ') || 'none'}`)

  if (dryRun) {
    console.log('\n--- DRY RUN: Would implement this ticket ---')
    console.log(`Branch: ${buildBranchName(ticket)}`)
    console.log(`Description:\n${ticket.description?.slice(0, 500) || '(no description)'}`)
    return
  }

  // 3. Move to In Progress, tag with Agent: Dev, and comment
  await updateIssueState(ticket.id, inProgressStateId)
  await addLabelToIssue(ticket.id, 'Agent: Dev', TEAM_ID)
  await addIssueComment(ticket.id, `🤖 **Dev Agent** is picking up this ticket.\n\nCreating branch and starting implementation...`)
  console.log('   → Moved to In Progress, tagged as Agent: Dev')

  // 4. Create feature branch (follows team convention: type/ticket-slug)
  const branchName = buildBranchName(ticket)

  try {
    execSync(`git checkout main && git pull origin main`, { stdio: 'pipe' })
    execSync(`git checkout -b ${branchName}`, { stdio: 'pipe' })
    console.log(`   → Created branch: ${branchName}`)
  } catch {
    try {
      execSync(`git checkout ${branchName}`, { stdio: 'pipe' })
      console.log(`   → Resumed branch: ${branchName}`)
    } catch (err) {
      await failTicket(ticket, stateMap, `Failed to create branch \`${branchName}\`:\n\`\`\`\n${err instanceof Error ? err.message : err}\n\`\`\``)
      return
    }
  }

  // 5. Implement with Claude Code
  console.log('\n🧠 Running Claude Code to implement...\n')

  try {
    const output = execSync(
      `claude -p --verbose --allowedTools "Edit,Write,Bash,Read,Glob,Grep" --max-turns 30`,
      {
        input: buildImplementationPrompt(ticket),
        encoding: 'utf-8',
        timeout: 5 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      }
    )
    console.log(output.slice(-500))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ Implementation failed:', message.slice(0, 500))
    await failTicket(ticket, stateMap, `Claude Code failed during implementation. The ticket may need more detail or manual work.\n\n<details><summary>Error</summary>\n\n\`\`\`\n${message.slice(0, 1000)}\n\`\`\`\n</details>`)
    execSync(`git checkout main`, { stdio: 'pipe' })
    return
  }

  // 6. Verify changes exist (check both uncommitted changes AND new commits vs main)
  const uncommittedChanges = execSync('git diff --stat HEAD', { encoding: 'utf-8' }).trim()
  const hasNewFiles = execSync('git ls-files --others --exclude-standard', { encoding: 'utf-8' }).trim()
  const newCommits = execSync('git log main..HEAD --oneline', { encoding: 'utf-8' }).trim()

  if (!uncommittedChanges && !hasNewFiles && !newCommits) {
    console.log('⚠️  No changes produced.')
    await failTicket(ticket, stateMap, 'Analyzed the ticket but produced no code changes. This ticket may need a more detailed description with specific file paths and acceptance criteria.')
    execSync(`git checkout main`, { stdio: 'pipe' })
    return
  }

  // 7. Self-review: run a code review pass before creating PR
  console.log('\n🔍 Running self-review...\n')

  // Use uncommitted diff if present, otherwise diff committed changes vs main
  const diffForReview = uncommittedChanges
    ? execSync('git diff HEAD', { encoding: 'utf-8' })
    : execSync('git diff main..HEAD', { encoding: 'utf-8' })
  const newFilesContent = hasNewFiles
    ? hasNewFiles.split('\n').map((f) => {
        try { return `--- ${f} ---\n${execSync(`cat "${f}"`, { encoding: 'utf-8' })}` }
        catch { return '' }
      }).join('\n')
    : ''

  let reviewFeedback = ''
  try {
    reviewFeedback = execSync(
      `claude -p --allowedTools "Read,Glob,Grep" --max-turns 5`,
      {
        input: buildReviewPrompt(ticket, diffForReview + '\n' + newFilesContent),
        encoding: 'utf-8',
        timeout: 2 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
      }
    )
    console.log('Review feedback:', reviewFeedback.slice(-300))
  } catch {
    console.log('⚠️  Self-review failed, continuing with PR creation.')
  }

  // 8. If review found critical issues, try to fix them
  if (reviewFeedback.includes('CRITICAL:')) {
    console.log('\n🔧 Review found critical issues, attempting fix...\n')
    try {
      execSync(
        `claude -p --allowedTools "Edit,Write,Bash,Read,Glob,Grep" --max-turns 10`,
        {
          input: `Fix the following issues found during code review:\n\n${reviewFeedback}\n\nMake the fixes, run tests with \`npm test\`, and commit.`,
          encoding: 'utf-8',
          timeout: 3 * 60 * 1000,
          maxBuffer: 10 * 1024 * 1024,
        }
      )
    } catch {
      console.log('⚠️  Fix attempt failed, proceeding with current state.')
    }
  }

  // 9. Push and create PR
  console.log('\n📤 Creating pull request...')

  execSync(`git push -u origin ${branchName}`, { stdio: 'pipe' })

  const prBody = buildPRBody(ticket, reviewFeedback)
  const prUrl = execSync(
    `gh pr create --title "${escapeShell(`${ticket.identifier}: ${ticket.title}`)}" --body "$(cat <<'PRBODYEOF'\n${prBody}\nPRBODYEOF\n)" --base main`,
    { encoding: 'utf-8' }
  ).trim()

  console.log(`   → PR created: ${prUrl}`)

  // 10. Update Linear: move to In Review, link PR
  if (inReviewStateId) {
    await updateIssueState(ticket.id, inReviewStateId)
  }
  await addIssueComment(
    ticket.id,
    `🤖 **Dev Agent** created a pull request:\n\n**[${ticket.identifier}: ${ticket.title}](${prUrl})**\n\n${reviewFeedback ? '### Self-Review Notes\n' + reviewFeedback.slice(0, 500) : ''}\n\n→ Awaiting human review and merge.`
  )

  console.log(`\n✅ ${ticket.identifier} → PR created, moved to In Review`)
  execSync(`git checkout main`, { stdio: 'pipe' })
}

// --- Branch naming (follows real team conventions) ---

function buildBranchName(ticket: IssueNode): string {
  const labels = ticket.labels.nodes.map((l) => l.name.toLowerCase())

  // Determine branch type from labels/priority
  let type = 'feat'
  if (labels.some((l) => l.includes('bug') || l.includes('security'))) type = 'fix'
  else if (labels.some((l) => l.includes('infra') || l.includes('tech debt'))) type = 'chore'
  else if (labels.some((l) => l.includes('design') || l.includes('ux'))) type = 'design'
  if (ticket.priority === 1) type = 'hotfix'

  const slug = ticket.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

  return `${type}/${ticket.identifier.toLowerCase()}-${slug}`
}

// --- Prompts ---

function buildImplementationPrompt(ticket: IssueNode): string {
  const labels = ticket.labels.nodes.map((l) => l.name)

  return `You are a developer on the Du team. Du is a personal finance app for credit-card-first users in Brazil.

## Your Task

Implement this Linear ticket:

**${ticket.identifier}: ${ticket.title}**
Priority: P${ticket.priority}
Labels: ${labels.join(', ')}

### Description

${ticket.description || 'No description provided.'}

## Development Process

Follow this process like a real developer would:

1. **Understand the codebase first.** Read CLAUDE.md for project conventions. Read the relevant files mentioned in the ticket or related to the area (check the labels). Look at similar patterns in the codebase.

2. **Plan before coding.** Think about what files need to change and what the implementation approach should be. If the ticket involves UI, check existing components for patterns.

3. **Implement incrementally.** Make small, focused changes. Don't rewrite entire files — modify what's needed.

4. **Test your work.** Run \`npm test\` after implementation. If tests fail, fix them. Run \`npm run lint\` and fix any lint errors.

5. **Commit with a clear message.** Stage only the files you changed. Use conventional commits:
   - \`feat: description\` for new features
   - \`fix: description\` for bug fixes
   - \`chore: description\` for maintenance/infra
   - Always add \`Refs ${ticket.identifier}\` on a second line

## Rules

- Follow existing patterns — check how similar things are done in the codebase.
- Do NOT add new dependencies unless the ticket explicitly requires them.
- Do NOT modify files unrelated to this ticket.
- Do NOT create README or documentation files.
- Do NOT refactor code outside the scope of this ticket.
- Keep changes minimal and focused.
- If the ticket is unclear, implement the most reasonable interpretation and note assumptions in commit message.
`
}

function buildReviewPrompt(ticket: IssueNode, diff: string): string {
  return `You are a code reviewer on the Du team. Review this diff for ticket ${ticket.identifier}: "${ticket.title}".

## Diff

\`\`\`
${diff.slice(0, 8000)}
\`\`\`

## Review Checklist

1. **Correctness** — Does the code do what the ticket asks? Any bugs?
2. **Conventions** — Does it follow existing patterns? Check CLAUDE.md.
3. **Safety** — Any security issues? SQL injection, XSS, exposed secrets?
4. **Tests** — Were tests added/updated if needed?
5. **Scope** — Are there changes unrelated to the ticket?

## Output Format

If you find critical issues, prefix them with "CRITICAL:" so they get fixed before PR creation.
For non-critical suggestions, prefix with "NOTE:".
If everything looks good, just say "LGTM — no critical issues found."

Be concise. Only flag real problems, not style preferences.`
}

function buildPRBody(ticket: IssueNode, reviewNotes: string): string {
  const labels = ticket.labels.nodes.map((l) => l.name).join(', ')

  return `## ${ticket.identifier}: ${ticket.title}

**Priority:** P${ticket.priority} | **Labels:** ${labels}

### Description

${ticket.description?.slice(0, 800) || '(no description)'}

### Self-Review

${reviewNotes ? reviewNotes.slice(0, 500) : 'No issues found during self-review.'}

---

Linear: https://linear.app/lumos/issue/${ticket.identifier}

🤖 Implemented by Du Dev Agent | Awaiting human review`
}

// --- Utilities ---

function escapeShell(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`')
}

async function failTicket(
  ticket: IssueNode,
  stateMap: Record<string, string>,
  reason: string
): Promise<void> {
  await addIssueComment(ticket.id, `❌ **Dev Agent** failed on this ticket:\n\n${reason}`)
  const todoStateId = stateMap['Todo'] || stateMap['Backlog']
  if (todoStateId) await updateIssueState(ticket.id, todoStateId)
}

main().catch((err) => {
  console.error('❌ Dev Agent failed:', err)
  process.exit(1)
})
