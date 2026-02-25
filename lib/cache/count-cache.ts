/**
 * Count query cache. Uses Redis when available, falls back to in-memory Map.
 * Reduces repeated COUNT(*) calls when paginating (clients, transactions, loans).
 */

import { redisGet, redisSet, isRedisAvailable } from './redis';

const COUNT_TTL_SECONDS = 60;
const COUNT_KEY_PREFIX = 'count:';

/** In-memory fallback when Redis is unavailable */
const TTL_MS = 60_000;

interface MemoryCacheEntry {
  value: number;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

function redisCountKey(key: string): string {
  return `${COUNT_KEY_PREFIX}${key}`;
}

/**
 * Get count from cache or fetch and cache it.
 * Uses Redis when REDIS_URL is set; otherwise uses in-memory cache.
 *
 * @param key - Stable cache key (e.g., from buildCountCacheKey)
 * @param fetcher - Async function that returns the count
 */
export async function getCachedCount(
  key: string,
  fetcher: () => Promise<number>
): Promise<number> {
  if (isRedisAvailable()) {
    const redisKey = redisCountKey(key);
    const cached = await redisGet<number>(redisKey);
    if (cached != null && typeof cached === 'number') {
      return cached;
    }
    const value = await fetcher();
    await redisSet(redisKey, value, COUNT_TTL_SECONDS);
    return value;
  }

  const now = Date.now();
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > now) {
    return entry.value;
  }

  const value = await fetcher();
  memoryCache.set(key, {
    value,
    expiresAt: now + TTL_MS,
  });
  return value;
}
