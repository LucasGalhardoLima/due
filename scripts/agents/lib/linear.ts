import type { AgentIssue, AgentDocument } from './types.js'

const ENDPOINT = 'https://api.linear.app/graphql'
const API_KEY = process.env.LINEAR_API_KEY

function requireApiKey(): string {
  if (!API_KEY) {
    throw new Error('LINEAR_API_KEY environment variable is required')
  }
  return API_KEY
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: requireApiKey(),
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> }

  if (json.errors?.length) {
    throw new Error(`Linear API error: ${json.errors.map((e) => e.message).join(', ')}`)
  }

  return json.data as T
}

// --- Team labels (team-scoped query, returns Agent labels etc.) ---

interface LabelNode {
  id: string
  name: string
  isGroup: boolean
  parent: { id: string; name: string } | null
}

let _teamLabelsCache: { teamId: string; labels: LabelNode[] } | null = null

async function getTeamLabels(teamId: string): Promise<LabelNode[]> {
  if (_teamLabelsCache?.teamId === teamId) return _teamLabelsCache.labels

  const data = await graphql<{
    team: { labels: { nodes: LabelNode[] } }
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        labels(first: 250) {
          nodes { id name isGroup parent { id name } }
        }
      }
    }`,
    { teamId }
  )

  const labels = data.team.labels.nodes
  _teamLabelsCache = { teamId, labels }
  return labels
}

// --- Cycles ---

export interface CycleNode {
  id: string
  number: number
  name: string | null
  startsAt: string
  endsAt: string
}

export async function getActiveCycle(teamId: string): Promise<CycleNode | null> {
  const data = await graphql<{
    team: { activeCycle: CycleNode | null }
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        activeCycle { id number name startsAt endsAt }
      }
    }`,
    { teamId }
  )
  return data.team.activeCycle
}

// --- Issues ---

export interface IssueNode {
  id: string
  identifier: string
  title: string
  description: string
  priority: number
  state: { id: string; name: string; type: string }
  labels: { nodes: Array<{ name: string }> }
}

const ISSUE_FIELDS = `
  id identifier title description priority
  state { id name type }
  labels { nodes { name } }
`

export async function getOpenIssues(projectId: string): Promise<IssueNode[]> {
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!) {
      project(id: $projectId) {
        issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 250) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    }`,
    { projectId }
  )
  return data.project.issues.nodes
}

export async function getRejectedIssues(projectId: string): Promise<IssueNode[]> {
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!) {
      project(id: $projectId) {
        issues(filter: { state: { type: { eq: "canceled" } }, canceledAt: { gte: "-P30D" } }, first: 100) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    }`,
    { projectId }
  )
  return data.project.issues.nodes
}

// --- Ticket management (used by dev agent) ---

export async function getReadyTickets(projectId: string): Promise<IssueNode[]> {
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!) {
      project(id: $projectId) {
        issues(
          filter: { state: { name: { in: ["Todo", "Ready"] } } }
          orderBy: updatedAt
          first: 10
        ) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    }`,
    { projectId }
  )
  // Sort by priority (1=Urgent first, 4=Low last, 0=No priority last)
  return data.project.issues.nodes.sort((a, b) => {
    const pa = a.priority || 5
    const pb = b.priority || 5
    return pa - pb
  })
}

export async function getWorkflowStates(teamId: string): Promise<Array<{ id: string; name: string; type: string }>> {
  const data = await graphql<{
    team: { states: { nodes: Array<{ id: string; name: string; type: string }> } }
  }>(
    `query($teamId: String!) {
      team(id: $teamId) {
        states { nodes { id name type } }
      }
    }`,
    { teamId }
  )
  return data.team.states.nodes
}

export async function updateIssueState(issueId: string, stateId: string): Promise<void> {
  await graphql(
    `mutation($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) {
        success
      }
    }`,
    { id: issueId, stateId }
  )
}

export async function addLabelToIssue(issueId: string, labelName: string, teamId: string): Promise<void> {
  const labelMap = await getLabelIds([labelName], teamId)
  const labelId = labelMap[labelName]
  if (!labelId) return

  // Fetch current labels with names so we can check exclusivity
  const data = await graphql<{
    issue: { labels: { nodes: Array<{ id: string; name: string }> } }
  }>(
    `query($id: String!) {
      issue(id: $id) { labels { nodes { id name } } }
    }`,
    { id: issueId }
  )

  const currentLabels = data.issue.labels.nodes
  if (currentLabels.some((l) => l.id === labelId)) return // already has the label

  // Deduplicate ALL labels by group to prevent exclusive group conflicts.
  // This handles both new label conflicts AND pre-existing conflicts on the issue.
  const groupMap = await getLabelGroupMap(teamId)
  const allLabels = [...currentLabels, { id: labelId, name: labelName }]

  // For grouped labels, keep the LAST one per group (so the new label wins over existing)
  const groupWinners = new Map<string, { id: string; name: string }>()
  const ungrouped: Array<{ id: string; name: string }> = []

  for (const label of allLabels) {
    const group = groupMap[label.name]
    if (group) {
      groupWinners.set(group, label)
    } else {
      ungrouped.push(label)
    }
  }

  const finalLabelIds = [
    ...Array.from(groupWinners.values()).map((l) => l.id),
    ...ungrouped.map((l) => l.id),
  ]

  await graphql(
    `mutation($id: String!, $labelIds: [String!]!) {
      issueUpdate(id: $id, input: { labelIds: $labelIds }) { success }
    }`,
    { id: issueId, labelIds: finalLabelIds }
  )
}

export async function addIssueComment(issueId: string, body: string): Promise<void> {
  await graphql(
    `mutation($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body }
  )
}

export async function getCompletedIssuesThisWeek(projectId: string): Promise<IssueNode[]> {
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!) {
      project(id: $projectId) {
        issues(
          filter: { state: { type: { eq: "completed" } }, completedAt: { gte: "-P7D" } }
          first: 50
        ) {
          nodes { ${ISSUE_FIELDS} }
        }
      }
    }`,
    { projectId }
  )
  return data.project.issues.nodes
}

export async function getLabelIds(names: string[], teamId: string): Promise<Record<string, string>> {
  const labels = await getTeamLabels(teamId)

  const map: Record<string, string> = {}
  for (const label of labels) {
    if (label.isGroup) continue
    if (names.includes(label.name)) {
      map[label.name] = label.id
    }
  }
  return map
}

// Linear requires that labels within the same group are exclusive (one per group).
// Filter labels to keep only one per group. Ungrouped labels all pass through.
export function filterExclusiveLabels(
  labelNames: string[],
  labelGroupMap: Record<string, string>
): string[] {
  const groups: Record<string, string[]> = {}
  const ungrouped: string[] = []

  for (const name of labelNames) {
    const group = labelGroupMap[name]
    if (group) {
      if (!groups[group]) groups[group] = []
      groups[group].push(name)
    } else {
      ungrouped.push(name)
    }
  }

  // For each group, keep only the first label
  const result: string[] = []
  for (const labels of Object.values(groups)) {
    result.push(labels[0])
  }
  // Ungrouped labels are not exclusive — keep all of them
  result.push(...ungrouped)
  return result
}

let _labelGroupMap: Record<string, string> | null = null

export async function getLabelGroupMap(teamId: string): Promise<Record<string, string>> {
  if (_labelGroupMap) return _labelGroupMap

  const labels = await getTeamLabels(teamId)

  _labelGroupMap = {}
  for (const label of labels) {
    if (!label.isGroup && label.parent) {
      _labelGroupMap[label.name] = label.parent.name
    }
  }
  return _labelGroupMap
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
