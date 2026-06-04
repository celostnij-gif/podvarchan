/**
 * D1 Database access helper для Server Actions.
 *
 * Отримує D1 binding з Cloudflare контексту та повертає
 * Drizzle ORM інстанс. При недоступності D1 кидає помилку.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '@/db/schema'

let _actionDb: DrizzleD1Database<typeof schema> | null = null

/**
 * Отримує Drizzle інстанс для D1 всередині Server Action.
 * @throws Error якщо D1 недоступний
 */
export function getActionDb(): DrizzleD1Database<typeof schema> {
  if (_actionDb) return _actionDb

  try {
    const ctx = getCloudflareContext()
    const binding = (ctx.env as unknown as Record<string, unknown>).DB as D1Database | undefined
    if (!binding) {
      throw new Error('D1 binding недоступний. Запустіть проект через wrangler.')
    }
    _actionDb = getDb(binding)
    return _actionDb
  } catch (err) {
    if (err instanceof Error && err.message.includes('D1 binding')) throw err
    throw new Error('Не вдалося підключитися до бази даних. Переконайтеся, що D1 налаштовано.')
  }
}

/**
 * Скидає кешований інстанс (для тестів).
 */
export function resetActionDb(): void {
  _actionDb = null
}
