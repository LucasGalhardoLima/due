import { readFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import { execSync } from 'node:child_process'
import { glob } from 'node:fs/promises'

const ROOT = resolve(import.meta.dirname, '..', '..', '..')
const MAX_FILE_SIZE = 50_000
const MAX_TOTAL_SIZE = 400_000

export async function buildContext(
  patterns: string[],
  diffOnly: boolean = false
): Promise<string> {
  let filePaths: string[]

  if (diffOnly) {
    try {
      const diff = execSync('git diff --name-only HEAD~5', {
        cwd: ROOT,
        encoding: 'utf-8',
      }).trim()
      filePaths = diff ? diff.split('\n').map((f) => resolve(ROOT, f)) : []
    } catch {
      filePaths = await globFiles(patterns)
    }
  } else {
    filePaths = await globFiles(patterns)
  }

  let totalSize = 0
  const parts: string[] = []

  for (const filePath of filePaths) {
    if (totalSize >= MAX_TOTAL_SIZE) break

    try {
      const content = readFileSync(filePath, 'utf-8')
      if (content.length > MAX_FILE_SIZE) continue
      if (totalSize + content.length > MAX_TOTAL_SIZE) continue

      const rel = relative(ROOT, filePath)
      parts.push(`--- ${rel} ---\n${content}`)
      totalSize += content.length
    } catch {
      // Skip unreadable files
    }
  }

  return parts.join('\n\n')
}

async function globFiles(patterns: string[]): Promise<string[]> {
  const files: string[] = []
  for (const pattern of patterns) {
    for await (const entry of glob(pattern, { cwd: ROOT })) {
      files.push(resolve(ROOT, entry))
    }
  }
  return [...new Set(files)].sort()
}

export function readPrompt(promptFile: string): string {
  const path = resolve(import.meta.dirname, '..', 'prompts', promptFile)
  return readFileSync(path, 'utf-8')
}

export function readPersonas(): string {
  const path = resolve(import.meta.dirname, '..', 'context', 'user-personas.md')
  try {
    return readFileSync(path, 'utf-8')
  } catch {
    return ''
  }
}
