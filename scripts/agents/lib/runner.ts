import 'dotenv/config'
import type { AgentConfig, AgentResult } from './types.js'
import { buildContext, readPrompt, readPersonas } from './context.js'
import { analyzeWithClaude } from './claude.js'
import { fetchProductContext } from './api.js'
import {
  getOpenIssues,
  getRejectedIssues,
  getLabelIds,
  getLabelGroupMap,
  filterExclusiveLabels,
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
  let openIssues: Array<{ title: string; description: string }> = []
  let rejectedIssues: Array<{ title: string; description: string }> = []

  try {
    openIssues = await getOpenIssues(config.projectId)
    rejectedIssues = await getRejectedIssues(config.projectId)
  } catch (err) {
    if (dryRun) {
      console.log('⚠️  Could not fetch Linear issues (dry run, continuing without dedup)')
    } else {
      throw err
    }
  }

  // 5. Fetch live product data (if configured)
  let productContext = ''
  if (config.apiEndpoints?.length) {
    console.log('🌐 Fetching live product data...')
    productContext = await fetchProductContext(config.apiEndpoints)
  }

  // 6. Build user message
  const userMessage = buildUserMessage(codeContext, personas, openIssues, rejectedIssues, productContext)

  // 7. Call Claude
  console.log('🧠 Analyzing with Claude...')
  const result = await analyzeWithClaude(systemPrompt, userMessage)

  // 8. Output results
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
  rejectedIssues: Array<{ title: string; description: string }>,
  productContext: string
): string {
  const parts: string[] = []

  parts.push('## Codebase\n\n' + codeContext)

  if (productContext) {
    parts.push(productContext)
  }

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
  const allLabels = [...new Set(result.issues.flatMap((i) => i.labels))]
  const labelMap = await getLabelIds(allLabels)
  const labelGroupMap = await getLabelGroupMap()

  for (const issue of result.issues) {
    // Linear requires exclusive labels per group — filter to one per group
    const filteredLabels = filterExclusiveLabels(issue.labels, labelGroupMap)
    const filteredIssue = { ...issue, labels: filteredLabels }

    try {
      const created = await createIssue(filteredIssue, config.teamId, config.projectId, labelMap)
      console.log(`  ✅ Created issue: ${created.identifier} — ${issue.title}`)
    } catch (err) {
      console.error(`  ⚠️  Failed to create issue "${issue.title}" (labels: ${filteredLabels.join(', ')}): ${err instanceof Error ? err.message : err}`)
    }
  }

  for (const doc of result.documents) {
    try {
      const created = await createDocument(doc, config.projectId)
      console.log(`  📄 Created document: ${doc.title} (${created.id})`)
    } catch (err) {
      console.error(`  ⚠️  Failed to create document "${doc.title}": ${err instanceof Error ? err.message : err}`)
    }
  }
}
