/**
 * cleanUpdate — Empty Overwrite Guard helper.
 *
 * Filters out null / undefined / empty-string values from an update object
 * so they never overwrite existing DB data in `.set()` calls.
 *
 * Usage:
 *   await db.update(table).set(cleanUpdate({ title, description })).where(...)
 *
 * System fields (like slug, status, type, sortOrder) can still be force-set
 * by constructing the object manually or by wrapping only user fields.
 *
 * NOTE: Return type is `T` (not `Partial<T>`) so Drizzle keeps required
 * columns like `id` typed as required. Callers must only pass non-empty
 * values for required columns — `crypto.randomUUID()` and Zod-validated
 * slugs always satisfy this.
 */
export function cleanUpdate<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      out[key] = value
    }
  }
  return out as T
}
