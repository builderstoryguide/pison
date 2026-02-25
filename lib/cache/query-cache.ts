/**
 * Query result caching utilities.
 * Uses MD5 hash of params for cache keys.
 */

import { createHash } from 'crypto';
import { redisGet, redisSet } from './redis';

/**
 * Build a cache key from a prefix and params object.
 * Uses MD5 hash for deterministic, collision-resistant keys.
 */
export function queryCacheKey(prefix: string, params: object): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, k) => {
      (acc as Record<string, unknown>)[k] = (params as Record<string, unknown>)[k];
      return acc;
    }, {} as Record<string, unknown>);
  const paramStr = JSON.stringify(sorted);
  const hash = createHash('md5').update(paramStr).digest('hex');
  return `query:${prefix}:${hash}`;
}

/**
 * Get cached query result.
 */
export async function getCachedQuery<T>(key: string): Promise<T | null> {
  return redisGet<T>(key);
}

/**
 * Set cached query result with TTL.
 */
export async function setCachedQuery<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  return redisSet(key, value, ttlSeconds);
}

/**
 * Cache-aside helper: return cached value if present, otherwise call fetcher,
 * store the result in Redis with the given TTL, and return it.
 */
export async function getCachedOrFetch<T>(
  cacheKeyPrefix: string,
  params: object,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const key = queryCacheKey(cacheKeyPrefix, params);
  const cached = await getCachedQuery<T>(key);
  if (cached !== null) return cached;
  const result = await fetcher();
  await setCachedQuery(key, result, ttlSeconds);
  return result;
}

/**
 * Cache-aside helper using a raw key (no hashing).
 */
export async function getCachedOrFetchByKey<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await getCachedQuery<T>(key);
  if (cached !== null) return cached;
  const result = await fetcher();
  await setCachedQuery(key, result, ttlSeconds);
  return result;
}
