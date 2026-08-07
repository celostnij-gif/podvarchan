#!/usr/bin/env node
/**
 * Purge zone cache for the public site's own pages after every code deploy.
 *
 * Cloudflare API v4: POST /zones/{zone_id}/purge_cache with {"files": [...]}
 * Required token scope: Zone → Cache Purge → Purge.
 * Path list: scripts/deploy-purge-paths.json — extend that file, not this one.
 *
 * Deliberately NOT purge_everything: a full purge right after every deploy would
 * cause a cache stampede (cold renders of every page at once) — the exact class
 * of incident behind the 1102 history on this project (AGENTS.md §1, plan v3 §0.1).
 *
 * Usage (CI): node scripts/purge-zone-cache.mjs
 * Env: CLOUDFLARE_API_TOKEN (required), CLOUDFLARE_ACCOUNT_ID (informational),
 *      CLOUDFLARE_ZONE_ID (optional override), PURGE_BASE_URL (optional override).
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? '9ed1252ab93408d37152d76b4c8aea72'
const BASE = process.env.PURGE_BASE_URL ?? 'https://podvarchan.com'

const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) {
  console.error('purge-zone-cache: CLOUDFLARE_API_TOKEN is required')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const raw = await readFile(join(here, 'deploy-purge-paths.json'), 'utf8')
const paths = JSON.parse(raw)
if (!Array.isArray(paths) || paths.length === 0) {
  console.error('purge-zone-cache: deploy-purge-paths.json must contain a non-empty array')
  process.exit(1)
}

const files = paths.map((p) => (p.startsWith('http') ? p : `${BASE}${p}`))

const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ files }),
})
const body = await res.json().catch(() => null)

if (!res.ok || !body?.success) {
  console.error(`purge-zone-cache: purge failed (HTTP ${res.status})`)
  console.error(JSON.stringify(body ?? { errors: [{ message: 'non-JSON response' }] }, null, 2))
  process.exit(1)
}

console.log(`purge-zone-cache: purged ${files.length} files in zone ${ZONE_ID}`)
for (const f of files) console.log(`  - ${f}`)
