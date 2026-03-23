/**
 * Redis client singleton for DCMS caching.
 * Gracefully no-ops when REDIS_URL is unset (dev without Redis).
 *
 * Uses WHATWG URL API to parse REDIS_URL instead of passing the string
 * directly to ioredis, which uses deprecated url.parse() (Node DEP0169).
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

/**
 * Parse Redis URL using WHATWG URL API (avoids deprecated url.parse in ioredis).
 */
function parseRedisUrl(url: string): Record<string, unknown> {
  // Ensure protocol for URL constructor
  const normalized = url.startsWith('redis://') || url.startsWith('rediss://')
    ? url
    : `redis://${url}`;
  const u = new URL(normalized);
  const options: Record<string, unknown> = {};

  if (u.pathname && u.pathname.length > 1 && !u.hostname) {
    // Unix socket: redis:///tmp/redis.sock
    options.path = u.pathname;
  } else {
    options.host = u.hostname || 'localhost';
    options.port = u.port ? parseInt(u.port, 10) : 6379;
  }

  if (u.username) options.username = decodeURIComponent(u.username);
  if (u.password) options.password = decodeURIComponent(u.password);
  if (u.pathname && u.pathname.length > 1 && (u.protocol === 'redis:' || u.protocol === 'rediss:')) {
    const db = parseInt(u.pathname.slice(1), 10);
    if (!Number.isNaN(db)) options.db = db;
  }
  if (u.protocol === 'rediss:') options.tls = true;

  return options;
}

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const opts = parseRedisUrl(url);
    redis = new Redis({ ...opts, maxRetriesPerRequest: 3 });
    redis.on('error', (err) => console.warn('[Redis]', err.message));
    redis.on('ready', () => console.log('[Redis] Connected'));
    return redis;
  } catch (err) {
    console.warn('[Redis] Failed to connect:', err);
    return null;
  }
}

export async function redisGet<T = string>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const raw = await client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  } catch {
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds != null && ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
    return true;
  } catch {
    return false;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    await client.del(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete keys matching a pattern (e.g., "user:balance:*").
 * Uses SCAN to avoid blocking.
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  try {
    let count = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
        count += keys.length;
      }
    } while (cursor !== '0');
    return count;
  } catch {
    return 0;
  }
}

export function isRedisAvailable(): boolean {
  return !!getRedis();
}
