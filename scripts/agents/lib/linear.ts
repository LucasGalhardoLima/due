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
  const data = await graphql<{
    project: { issues: { nodes: IssueNode[] } }
  }>(
    `query($projectId: String!) {
      project(id: $projectId) {
        issues(filter: { state: { type: { eq: "canceled" } }, canceledAt: { gte: "-P30D" } }, first: 100) {
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

export async function getLabelIds(names: string[]): Promise<Record<string, string>> {
  const data = await graphql<{
    issueLabels: { nodes: Array<{ id: string; name: string; isGroup: boolean; parent: { id: string; name: string } | null }> }
  }>(
    `query {
      issueLabels(first: 100) {
        nodes { id name isGroup parent { id name } }
      }
    }`
  )

  const map: Record<string, string> = {}
  for (const label of data.issueLabels.nodes) {
    // Skip group labels — Linear only allows child labels on issues
    if (label.isGroup) continue
    if (names.includes(label.name)) {
      map[label.name] = label.id
    }
  }
  return map
}

// Linear requires that labels within the same group are exclusive (one per group).
// Filter labels to keep only one per group, preferring the most specific area label.
export function filterExclusiveLabels(
  labelNames: string[],
  labelGroupMap: Record<string, string>
): string[] {
  const groups: Record<string, string[]> = {}

  for (const name of labelNames) {
    const group = labelGroupMap[name] || 'none'
    if (!groups[group]) groups[group] = []
    groups[group].push(name)
  }

  // For each group, keep only the first label
  const result: string[] = []
  for (const labels of Object.values(groups)) {
    result.push(labels[0])
  }
  return result
}

let _labelGroupMap: Record<string, string> | null = null

export async function getLabelGroupMap(): Promise<Record<string, string>> {
  if (_labelGroupMap) return _labelGroupMap

  const data = await graphql<{
    issueLabels: { nodes: Array<{ name: string; isGroup: boolean; parent: { name: string } | null }> }
  }>(
    `query {
      issueLabels(first: 100) {
        nodes { name isGroup parent { name } }
      }
    }`
  )

  _labelGroupMap = {}
  for (const label of data.issueLabels.nodes) {
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
