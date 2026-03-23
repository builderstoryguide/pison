/**
 * Sanitize a string for safe use in filenames and HTTP headers (e.g. Content-Disposition).
 * Strips CR, LF, slashes, quotes, and anything not in a safe whitelist (0-9, a-z, A-Z, -).
 * For date strings, preserves ISO date chars (YYYY-MM-DD).
 */
export function sanitizeFilenameSegment(value: string | null | undefined): string {
  if (value == null || typeof value !== 'string') return 'unknown-date';
  const sanitized = value.replace(/[\r\n/\\"']/g, '').replace(/[^0-9a-zA-Z\-]/g, '');
  return sanitized.length > 0 ? sanitized : 'unknown-date';
}
