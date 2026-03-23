/**
 * Pagination constants for list queries.
 * Default 50 records per page, max 100 to balance performance and UX.
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Caps limit to MAX_PAGE_SIZE, defaults to DEFAULT_PAGE_SIZE if not provided.
 */
export function capLimit(limit?: number): number {
  const size = limit ?? DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, size), MAX_PAGE_SIZE);
}

/**
 * Encode cursor for cursor-based pagination.
 * Uses (createdAt, id) for stable ordering with ORDER BY createdAt DESC.
 */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: createdAt.toISOString(),
      id,
    })
  ).toString('base64url');
}

/**
 * Decode cursor. Returns null if invalid.
 */
export function decodeCursor(
  cursor: string
): { createdAt: Date; id: string } | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf-8')
    );
    if (typeof decoded.createdAt !== 'string' || typeof decoded.id !== 'string') {
      return null;
    }
    const date = new Date(decoded.createdAt);
    if (isNaN(date.getTime())) {
      return null;
    }
    return {
      createdAt: date,
      id: decoded.id,
    };
  } catch {
    return null;
  }
}

/**
 * Build a stable cache key for count queries.
 * Sorts keys to ensure consistent hashing.
 */
export function buildCountCacheKey(entity: string, filters: object): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce(
      (acc, k) => {
        const v = (filters as Record<string, unknown>)[k];
        if (v !== undefined && v !== null) {
          acc[k] = v;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );
  return `${entity}:${JSON.stringify(sorted)}`;
}
