'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@podvarchan/shared'

let _actionDb: ActionDb | null = null

export async function getActionDb() {
  return _actionDb ??= getDb(getCloudflareContext().env.DB as D1Database)
}
export type ActionDb = ReturnType<typeof getDb>
