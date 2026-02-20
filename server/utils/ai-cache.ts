interface CacheEntry<T> {
  value: T
  expiresAt: number
}

declare global {

  var aiCacheGlobal: Map<string, CacheEntry<unknown>> | undefined
}

const cache = globalThis.aiCacheGlobal ?? new Map<string, CacheEntry<unknown>>()
globalThis.aiCacheGlobal = cache

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

/** Invalidate all cache entries whose key starts with `prefix` */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}
