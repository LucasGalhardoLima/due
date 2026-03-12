import 'dotenv/config'
import type { AgentConfig, AgentResult } from './types.js'
import { buildContext, readPrompt, readPersonas } from './context.js'
import { analyzeWithClaude, type ImageInput } from './claude.js'
import { fetchProductContext } from './api.js'
import { captureScreenshots } from './screenshots.js'
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

  // 6. Capture screenshots (if configured)
  let images: ImageInput[] = []
  if (config.screenshotPages?.length) {
    console.log('📸 Capturing screenshots...')
    const captures = await captureScreenshots(config.screenshotPages, {
      includeA11y: config.includeA11yTree,
    })
    images = captures.screenshots.map((s) => ({
      label: s.label,
      base64: s.base64,
    }))
    console.log(`   ${images.length} screenshots captured`)

    // Append a11y trees to product context (text-based)
    if (captures.a11yTrees.length > 0) {
      const a11ySection = captures.a11yTrees
        .map((t) => `### ${t.label} — Accessibility Tree\n\`\`\`json\n${t.tree.slice(0, 8000)}\n\`\`\``)
        .join('\n\n')
      productContext += '\n\n## Accessibility Trees\n\n' + a11ySection
    }
  }

  // 7. Build user message
  const userMessage = buildUserMessage(codeContext, personas, openIssues, rejectedIssues, productContext)

  // 8. Call Claude
  console.log('🧠 Analyzing with Claude...')
  const result = await analyzeWithClaude(systemPrompt, userMessage, images.length > 0 ? images : undefined)

  // 9. Output results
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
  // Collect all labels including the agent identity label
  const allLabels = [...new Set([
    ...result.issues.flatMap((i) => i.labels),
    config.agentLabel,
  ])]
  const labelMap = await getLabelIds(allLabels, config.teamId)
  const labelGroupMap = await getLabelGroupMap(config.teamId)

  for (const issue of result.issues) {
    // Inject agent identity label into every issue
    const labelsWithAgent = [...new Set([...issue.labels, config.agentLabel])]
    // Linear requires exclusive labels per group — filter to one per group
    const filteredLabels = filterExclusiveLabels(labelsWithAgent, labelGroupMap)
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
