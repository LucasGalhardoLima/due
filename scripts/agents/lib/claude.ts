import Anthropic from '@anthropic-ai/sdk'
import type { AgentResult } from './types.js'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic()
  }
  return _client
}

const RESULT_SCHEMA = {
  type: 'object' as const,
  properties: {
    issues: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          description: { type: 'string' as const },
          labels: { type: 'array' as const, items: { type: 'string' as const } },
          priority: { type: 'number' as const, enum: [0, 1, 2, 3, 4] },
        },
        required: ['title', 'description', 'labels', 'priority'],
      },
    },
    documents: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          title: { type: 'string' as const },
          content: { type: 'string' as const },
        },
        required: ['title', 'content'],
      },
    },
    summary: { type: 'string' as const },
  },
  required: ['issues', 'documents', 'summary'],
}

export async function analyzeWithClaude(
  systemPrompt: string,
  userContent: string
): Promise<AgentResult> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
    tools: [
      {
        name: 'submit_analysis',
        description: 'Submit the analysis results as structured data',
        input_schema: RESULT_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'submit_analysis' },
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured output')
  }

  return toolUse.input as AgentResult
}
