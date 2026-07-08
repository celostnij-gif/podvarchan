'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@podvarchan/shared'

let _actionDb: ReturnType<typeof getDb> | null = null

export async function getActionDb() {
  return _actionDb ??= getDb(getCloudflareContext().env.DB as D1Database)
}
