import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * Minimal visitor counter.
 *   key = 'total'      → cumulative visits since launch
 *   key = 'YYYY-MM-DD' → visits on that calendar day (UTC)
 */
export const visitorStats = sqliteTable('visitor_stats', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
})
