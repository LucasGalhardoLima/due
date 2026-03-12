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

export interface ScreenshotPage {
  /** App route path, e.g. '/dashboard' */
  path: string
  /** Human-readable label for this page */
  label: string
  /** Optional CSS selector to wait for before capturing */
  waitFor?: string
}

export interface AgentConfig {
  name: string
  projectId: string
  teamId: string
  filePatterns: string[]
  promptFile: string
  includePersonas: boolean
  diffOnly?: boolean
  /** API endpoints to fetch as live product context (e.g. ['/api/dashboard/summary']) */
  apiEndpoints?: string[]
  /** Label to identify which agent created the issue (e.g. 'Agent: PM') */
  agentLabel: string
  /** Pages to screenshot for visual context */
  screenshotPages?: ScreenshotPage[]
  /** Include accessibility tree snapshots (UX agent) */
  includeA11yTree?: boolean
}
