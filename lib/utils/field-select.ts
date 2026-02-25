/**
 * Parse fields query parameter for API field selection.
 * Returns a Prisma select object or null (use default selection).
 */

/**
 * Parse comma-separated fields string against an allowlist.
 * Returns Prisma select object for top-level fields.
 * Nested relations use predefined select shapes.
 *
 * @param fieldsStr - e.g. "id,name,balance"
 * @param allowlist - allowed field names
 * @param relationSelects - optional map of relation name -> select shape (can be nested)
 * @returns Prisma select object or null to use default
 */
export function parseFieldsParam(
  fieldsStr: string | null,
  allowlist: string[],
  relationSelects?: Record<string, Record<string, unknown>>
): Record<string, boolean | Record<string, unknown>> | null {
  if (!fieldsStr || typeof fieldsStr !== 'string') return null;

  const requested = fieldsStr
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  if (requested.length === 0) return null;

  const select: Record<string, boolean | Record<string, unknown>> = {};
  for (const field of requested) {
    if (!allowlist.includes(field)) continue;
    if (relationSelects && relationSelects[field]) {
      select[field] = relationSelects[field];
    } else {
      select[field] = true;
    }
  }

  if (Object.keys(select).length === 0) return null;
  return select;
}
