import { drizzle } from 'drizzle-orm/d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import * as schema from '@podvarchan/shared'
import { getDb } from '@podvarchan/shared'

export function getDB() {
  const { env } = getCloudflareContext()
  return getDb(env.DB as D1Database)
}
