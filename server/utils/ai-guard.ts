import type { z } from 'zod'

// Strip characters that allow prompt injection: newlines inject new instructions;
// quotes/backticks break out of the surrounding string literal in the prompt template.
export function sanitizePromptInput(input: string): string {
  return input
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')
    .trim()
}

export function cleanAiJson(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
}

export function parseJsonWithSchema<T>(text: string, schema: z.ZodSchema<T>): T {
  const cleaned = cleanAiJson(text)
  let parsed: unknown

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Invalid JSON from AI')
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new Error('AI response failed schema validation')
  }

  return result.data
}
