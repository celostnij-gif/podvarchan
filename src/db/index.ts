/**
 * Drizzle ORM ініціалізація для Cloudflare D1 (SQLite).
 *
 * Використання:
 * ```ts
 * import { db } from '@/db'
 * const result = await db.select().from(users).where(eq(users.email, email))
 * ```
 *
 * Для локальної розробки (без D1) — використовуй in-memory SQLite.
 * Для production — передається D1 binding з Cloudflare Worker.
 */

import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

let _db: DrizzleD1Database<typeof schema> | null = null

/**
 * Повертає інстанс Drizzle ORM, прив'язаний до D1 binding.
 * Використовується всередині Cloudflare Workers / OpenNext.
 */
export function getDb(binding: D1Database): DrizzleD1Database<typeof schema> {
  if (!_db) {
    _db = drizzle(binding, { schema })
  }
  return _db
}

/**
 * Скидає кешований інстанс (корисно для тестів/перезавантаження).
 */
export function resetDb(): void {
  _db = null
}

export { schema }
