import 'dotenv/config'
import { execSync } from 'node:child_process'
import {
  getOpenIssues,
  getCompletedIssuesThisWeek,
  getActiveCycle,
  createDocument,
} from './lib/linear.js'
import type { CycleNode } from './lib/linear.js'

const PROJECT_ID = '1110277c-1489-4dfd-a8dd-adf894b6b6bf'
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log(`\n📊 Sprint Reporter${dryRun ? ' (DRY RUN)' : ''}...\n`)

  // 1. Gather data
  console.log('🔍 Gathering sprint data...')

  const [openIssues, completedIssues, prData, cycle] = await Promise.all([
    getOpenIssues(PROJECT_ID),
    getCompletedIssuesThisWeek(PROJECT_ID),
    getGitHubPRs(),
    getActiveCycle(TEAM_ID),
  ])

  // Categorize open issues by state
  const byState: Record<string, typeof openIssues> = {}
  for (const issue of openIssues) {
    const state = issue.state.name
    if (!byState[state]) byState[state] = []
    byState[state].push(issue)
  }

  // 2. Build report
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const report = buildReport({
    dateRange: `${weekAgo} → ${today}`,
    openIssues,
    completedIssues,
    byState,
    prs: prData,
    cycle,
  })

  // 3. Output
  if (dryRun) {
    console.log('\n--- SPRINT REPORT ---\n')
    console.log(report)
  } else {
    const cycleLabel = cycle ? (cycle.name || `Cycle ${cycle.number}`) : today
    const doc = await createDocument(
      { title: `Sprint Report — ${cycleLabel}`, content: report },
      PROJECT_ID
    )
    console.log(`\n✅ Sprint report created: ${doc.id}`)
  }
}

interface PRInfo {
  title: string
  url: string
  state: string
  author: string
  createdAt: string
}

async function getGitHubPRs(): Promise<PRInfo[]> {
  try {
    const output = execSync(
      `gh pr list --state all --json title,url,state,author,createdAt --limit 20`,
      { encoding: 'utf-8', timeout: 15000 }
    )
    const prs = JSON.parse(output) as Array<{
      title: string
      url: string
      state: string
      author: { login: string }
      createdAt: string
    }>

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return prs
      .filter((pr) => new Date(pr.createdAt).getTime() > weekAgo)
      .map((pr) => ({
        title: pr.title,
        url: pr.url,
        state: pr.state,
        author: pr.author.login,
        createdAt: pr.createdAt.split('T')[0],
      }))
  } catch {
    console.log('⚠️  Could not fetch GitHub PRs')
    return []
  }
}

interface ReportData {
  dateRange: string
  openIssues: Array<{ identifier: string; title: string; priority: number; state: { name: string }; labels: { nodes: Array<{ name: string }> } }>
  completedIssues: Array<{ identifier: string; title: string; priority: number; labels: { nodes: Array<{ name: string }> } }>
  byState: Record<string, Array<{ identifier: string; title: string; priority: number }>>
  prs: PRInfo[]
  cycle: CycleNode | null
}

function buildReport(data: ReportData): string {
  const lines: string[] = []

  if (data.cycle) {
    const cycleName = data.cycle.name || `Cycle ${data.cycle.number}`
    const cycleStart = data.cycle.startsAt.split('T')[0]
    const cycleEnd = data.cycle.endsAt.split('T')[0]
    lines.push(`# Sprint Report — ${cycleName}`)
    lines.push(`**Cycle:** ${cycleStart} → ${cycleEnd} | **Period:** ${data.dateRange}`)
  } else {
    lines.push(`# Weekly Sprint Report`)
    lines.push(`**Period:** ${data.dateRange}`)
  }
  lines.push('')

  // Summary stats
  lines.push('## Summary')
  lines.push('')
  lines.push(`| Metric | Count |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Open issues | ${data.openIssues.length} |`)
  lines.push(`| Completed this week | ${data.completedIssues.length} |`)
  lines.push(`| PRs this week | ${data.prs.length} |`)
  lines.push(`| PRs merged | ${data.prs.filter((p) => p.state === 'MERGED').length} |`)
  lines.push('')

  // Completed work
  if (data.completedIssues.length > 0) {
    lines.push('## Completed This Week')
    lines.push('')
    for (const issue of data.completedIssues) {
      const labels = issue.labels.nodes.map((l) => l.name).join(', ')
      lines.push(`- **${issue.identifier}** ${issue.title} _(${labels})_`)
    }
    lines.push('')
  }

  // In Progress
  if (data.byState['In Progress']?.length) {
    lines.push('## In Progress')
    lines.push('')
    for (const issue of data.byState['In Progress']) {
      lines.push(`- **[P${issue.priority}]** ${issue.identifier} — ${issue.title}`)
    }
    lines.push('')
  }

  // In Review
  if (data.byState['In Review']?.length) {
    lines.push('## Awaiting Review')
    lines.push('')
    for (const issue of data.byState['In Review']) {
      lines.push(`- **[P${issue.priority}]** ${issue.identifier} — ${issue.title}`)
    }
    lines.push('')
  }

  // PRs
  if (data.prs.length > 0) {
    lines.push('## Pull Requests')
    lines.push('')
    for (const pr of data.prs) {
      const icon = pr.state === 'MERGED' ? '✅' : pr.state === 'OPEN' ? '🔄' : '❌'
      lines.push(`- ${icon} [${pr.title}](${pr.url}) — ${pr.author} (${pr.createdAt})`)
    }
    lines.push('')
  }

  // Backlog snapshot
  const backlog = data.byState['Backlog'] || data.byState['Triage'] || []
  const todo = data.byState['Todo'] || data.byState['Ready'] || []
  if (backlog.length > 0 || todo.length > 0) {
    lines.push('## Backlog Snapshot')
    lines.push('')
    lines.push(`**Ready to pick up (${todo.length}):**`)
    for (const issue of todo.slice(0, 5)) {
      lines.push(`- **[P${issue.priority}]** ${issue.identifier} — ${issue.title}`)
    }
    if (todo.length > 5) lines.push(`- _...and ${todo.length - 5} more_`)
    lines.push('')
    lines.push(`**In backlog:** ${backlog.length} issues`)
    lines.push('')
  }

  lines.push('---')
  lines.push('_Generated by Du Sprint Reporter_')

  return lines.join('\n')
}

main().catch((err) => {
  console.error('❌ Sprint Reporter failed:', err)
  process.exit(1)
})
