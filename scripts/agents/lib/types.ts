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
