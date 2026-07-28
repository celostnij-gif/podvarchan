'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@podvarchan/shared'

// Module-level singleton is safe in Cloudflare Workers (OpenNext) because
// each request is isolated — the module cache is per-request, not shared.
// See https://opennext.js.org/cloudflare/architecture
let _actionDb: ActionDb | null = null

export async function getActionDb() {
  return _actionDb ??= getDb(getCloudflareContext().env.DB as D1Database)
}
export type ActionDb = ReturnType<typeof getDb>
