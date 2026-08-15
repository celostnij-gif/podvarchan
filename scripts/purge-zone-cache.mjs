#!/usr/bin/env node
/**
 * Purge + warm zone cache for the public site's own pages after every code
 * deploy — a single operation (P0-3, AGENTS.md §3.5).
 *
 * 1. Purge — two calls (both needed; a files purge alone does NOT reach the
 *    worker's `caches.default` entries):
 *    a. Cloudflare API v4 POST /zones/{zone_id}/purge_cache {"files": [...]}
 *       — zone HTTP cache. Required token scope: Zone → Cache Purge → Purge.
 *    b. POST /zones/{zone_id}/purge_cache {"tags": [...]} with tag
 *       `_N_T_<path>` (CACHE_TAG_PREFIX, src/lib/cdn-cache.ts) — this is the
 *       only way to clear the OpenNext edge-cache entries in `caches.default`
 *       globally (a local `caches.default.delete` only clears the data center
 *       the request lands in). Purge API limit: 30 tags per request → chunk.
 * 2. Warm: immediately GET each purged path so the cold render happens now
 *    (during the deploy, in CI), never for the first real visitor. Batched to
 *    a small concurrency to avoid a self-imposed stampede. Skippable with
 *    PURGE_WARM=0 (emergency purge-only).
 *
 * Path list: scripts/deploy-purge-paths.json — extend that file, not this one.
 *
 * Deliberately NOT purge_everything: a full purge right after every deploy would
 * cause a cache stampede (cold renders of every page at once) — the exact class
 * of incident behind the 1102 history on this project (AGENTS.md §1, plan v3 §0.1).
 *
 * Usage (CI): node scripts/purge-zone-cache.mjs
 * Env: CLOUDFLARE_API_TOKEN (required), CLOUDFLARE_ACCOUNT_ID (informational),
 *      CLOUDFLARE_ZONE_ID (optional override), PURGE_BASE_URL (optional override),
 *      PURGE_WARM (optional, default "1"; "0" skips the warm phase).
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? '9ed1252ab93408d37152d76b4c8aea72'
const BASE = process.env.PURGE_BASE_URL ?? 'https://podvarchan.com'
const WARM = process.env.PURGE_WARM !== '0'
const WARM_CONCURRENCY = 6
const TAGS_PER_REQUEST = 30

/** Cache-Tag prefix — keep in sync with src/lib/cdn-cache.ts (CACHE_TAG_PREFIX). */
const CACHE_TAG_PREFIX = '_N_T_'

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
const tags = paths.map((p) => {
  const clean = p.startsWith('http') ? new URL(p).pathname : p
  return `${CACHE_TAG_PREFIX}${clean.startsWith('/') ? clean : `/${clean}`}`
})

async function purgeCache(payload) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.success) {
    console.error(`purge-zone-cache: purge failed (HTTP ${res.status}) for ${JSON.stringify(payload).slice(0, 120)}`)
    console.error(JSON.stringify(body ?? { errors: [{ message: 'non-JSON response' }] }, null, 2))
    process.exit(1)
  }
}

/* Files purge — zone HTTP cache. */
await purgeCache({ files })
console.log(`purge-zone-cache: purged ${files.length} files in zone ${ZONE_ID}`)
for (const f of files) console.log(`  - ${f}`)

/* Cache-Tag purge — global invalidation of the worker's `caches.default`
 * entries (OpenNext edge cache), chunked by the API's 30-tags-per-request cap. */
for (let i = 0; i < tags.length; i += TAGS_PER_REQUEST) {
  const chunk = tags.slice(i, i + TAGS_PER_REQUEST)
  await purgeCache({ tags: chunk })
}
console.log(`purge-zone-cache: purged ${tags.length} cache-tags in zone ${ZONE_ID}`)
for (const t of tags) console.log(`  - ${t}`)

/* ── Warm phase (P0-3): purge без последующего прогрева — незавершённая
 * операция (AGENTS.md §3.5). Холодный рендер обязан произойти сейчас, во
 * время деплоя, а не для первого реального посетителя. Ограниченный
 * конкеренси, чтобы не устроить стампид на собственном воркере. */
if (WARM) {
  console.log(`purge-zone-cache: warm phase (concurrency ${WARM_CONCURRENCY})`)
  let ok = 0
  const failed = []
  for (let i = 0; i < files.length; i += WARM_CONCURRENCY) {
    const batch = files.slice(i, i + WARM_CONCURRENCY)
    const results = await Promise.all(
      batch.map(async (url) => {
        const started = Date.now()
        try {
          const r = await fetch(url)
          r.body?.cancel()
          const ms = Date.now() - started
          if (r.status >= 200 && r.status < 400) {
            ok += 1
            console.log(`  warm OK   ${r.status} ${ms}ms ${url}`)
          } else {
            failed.push(url)
            console.log(`  warm WARN ${r.status} ${ms}ms ${url}`)
          }
        } catch (err) {
          failed.push(url)
          console.error(`  warm ERR  ${err instanceof Error ? err.message : String(err)} ${url}`)
        }
      }),
    )
    void results
  }
  console.log(`purge-zone-cache: warm done — ${ok}/${files.length} ok${failed.length ? `, failed: ${failed.join(', ')}` : ''}`)
  if (failed.length > 0) process.exitCode = 1
}
