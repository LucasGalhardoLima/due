import Anthropic from '@anthropic-ai/sdk'
import type { AgentResult } from './types.js'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic()
  }
  return _client
}

export interface ImageInput {
  label: string
  base64: string
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
  userContent: string,
  images?: ImageInput[]
): Promise<AgentResult> {
  // Build content blocks: text first, then images if provided
  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = images?.length
    ? buildContentWithImages(userContent, images)
    : userContent

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
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

  const raw = toolUse.input as Record<string, unknown>
  return {
    issues: Array.isArray(raw.issues) ? raw.issues : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    summary: typeof raw.summary === 'string' ? raw.summary : '',
  } as AgentResult
}

function buildContentWithImages(
  text: string,
  images: ImageInput[]
): Anthropic.Messages.ContentBlockParam[] {
  const blocks: Anthropic.Messages.ContentBlockParam[] = [
    { type: 'text', text },
    {
      type: 'text',
      text: `\n\n## Screenshots\n\nThe following ${images.length} screenshots show the current state of the app. Analyze them alongside the code context above.`,
    },
  ]

  for (const img of images) {
    blocks.push(
      { type: 'text', text: `### ${img.label}` },
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: img.base64,
        },
      }
    )
  }

  return blocks
}
