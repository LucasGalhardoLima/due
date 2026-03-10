import 'dotenv/config'

const ENDPOINT = 'https://api.linear.app/graphql'
const API_KEY = process.env.LINEAR_API_KEY!
const TEAM_ID = 'aa1ef0a5-b3f3-47d0-9429-89b0d58913ca'

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(', '))
  return json.data as T
}

// Agent label group + individual labels
const AGENT_LABELS = [
  { name: 'Agent: PM', color: '#4C9AFF' },          // blue
  { name: 'Agent: Product Designer', color: '#998DD9' }, // purple
  { name: 'Agent: Tech Debt', color: '#F59E0B' },    // amber
  { name: 'Agent: Security', color: '#EF4444' },     // red
  { name: 'Agent: UX', color: '#10B981' },            // green
  { name: 'Agent: Brand', color: '#EC4899' },         // pink
  { name: 'Agent: Dev', color: '#6366F1' },            // indigo
  { name: 'Agent: Sprint Planner', color: '#8B5CF6' }, // violet
]

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  // 1. Check if "Agent" parent label group exists
  const existing = await graphql<{
    issueLabels: { nodes: Array<{ id: string; name: string; isGroup: boolean }> }
  }>(`query { issueLabels(first: 200) { nodes { id name isGroup } } }`)

  const existingNames = new Set(existing.issueLabels.nodes.map((l) => l.name))

  // 2. Create parent group "Agent" if needed
  let parentId: string | undefined
  const parentLabel = existing.issueLabels.nodes.find((l) => l.name === 'Agent' && l.isGroup)

  if (parentLabel) {
    parentId = parentLabel.id
    console.log(`✅ Parent label "Agent" already exists (${parentId})`)
  } else if (dryRun) {
    console.log('Would create parent label group: "Agent"')
  } else {
    const created = await graphql<{
      issueLabelCreate: { success: boolean; issueLabel: { id: string } }
    }>(
      `mutation($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) { success issueLabel { id } }
      }`,
      { input: { name: 'Agent', color: '#6B7280', teamId: TEAM_ID, isGroup: true } }
    )
    parentId = created.issueLabelCreate.issueLabel.id
    console.log(`✅ Created parent label group: "Agent" (${parentId})`)
  }

  // 3. Create child labels
  for (const label of AGENT_LABELS) {
    if (existingNames.has(label.name)) {
      console.log(`  ✅ "${label.name}" already exists`)
      continue
    }

    if (dryRun) {
      console.log(`  Would create: "${label.name}" (${label.color})`)
      continue
    }

    try {
      await graphql(
        `mutation($input: IssueLabelCreateInput!) {
          issueLabelCreate(input: $input) { success issueLabel { id } }
        }`,
        {
          input: {
            name: label.name,
            color: label.color,
            teamId: TEAM_ID,
            parentId,
          },
        }
      )
      console.log(`  ✅ Created: "${label.name}"`)
    } catch (err) {
      console.error(`  ⚠️  Failed to create "${label.name}": ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('\nDone! Agent labels are ready.')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
