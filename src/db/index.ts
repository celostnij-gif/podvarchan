import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@podvarchan/shared'

export function getDB() {
  const { env } = getCloudflareContext()
  return getDb(env.DB as D1Database)
}
