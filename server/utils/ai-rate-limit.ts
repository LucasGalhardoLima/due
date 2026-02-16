import { createError } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

declare global {
   
  var aiRateLimitGlobal: Map<string, RateLimitEntry> | undefined
}

const limits = globalThis.aiRateLimitGlobal ?? new Map<string, RateLimitEntry>()
globalThis.aiRateLimitGlobal = limits

export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now()
  const entry = limits.get(key)

  if (!entry || now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs })
    return
  }

  if (entry.count >= limit) {
    throw createError({ statusCode: 429, statusMessage: 'Rate limit exceeded' })
  }

  entry.count += 1
  limits.set(key, entry)
}
