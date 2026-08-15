#!/usr/bin/env node
// Enforce AGENTS.md §4: every mutating server action must invalidate the public cache.
// Scans apps/admin/src/lib/actions/*.ts — any file calling db.insert/update/delete
// must import and call revalidatePublic (targeted keys/prefixes via the public
// worker's /api/revalidate route). Exit 1 on violation.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ACTIONS_DIR = join(process.cwd(), 'apps/admin/src/lib/actions')

// Files whose writes intentionally do NOT touch the public content cache:
// - redirects.ts: writes KV `redirect_rules` directly (separate zone from d1c:*);
//   middleware reads it with a 60s in-worker cache — no cross-worker purge needed.
// - users/leads/audit: admin-only rows (auth, lead inbox, audit log).
// - blockTemplates.ts: siteSettings rows under TEMPLATE_PREFIX — never read by the
//   public worker (no getSiteSetting callers in src/).
// - infrastructure files (db/index/result/clean-update/ymyl/search): no writes.
const ALLOWLIST = new Map([
  ['users.ts', 'admin auth only'],
  ['leads.ts', 'contact_leads/lead_events — admin-only inbox'],
  ['audit.ts', 'audit log, admin-only'],
  ['search.ts', 'no DB writes'],
  ['db.ts', 'db factory, no writes'],
  ['index.ts', 're-export barrel'],
  ['result.ts', 'action result types'],
  ['clean-update.ts', 'shared mutation helper, no writes'],
  ['ymyl.ts', 'validation helpers, no writes'],
  ['redirects.ts', 'writes KV redirect_rules directly — separate zone from d1c:*'],
  ['blockTemplates.ts', 'siteSettings under TEMPLATE_PREFIX — never read publicly'],
])

const MUTATION_RE = /\bdb\.(insert|update|delete)\s*\(/
const REVALIDATE_IMPORT_RE = /import\s+[^;]*(revalidatePublic|invalidateContent)[^;]*from/
const REVALIDATE_CALL_RE = /\b(revalidatePublic|invalidateContent)\s*\(/

const failures = []

for (const file of readdirSync(ACTIONS_DIR).filter((f) => f.endsWith('.ts'))) {
  const src = readFileSync(join(ACTIONS_DIR, file), 'utf8')
  if (!MUTATION_RE.test(src)) continue
  if (ALLOWLIST.has(file)) {
    console.log(`[invalidation] allowlist ${file}: ${ALLOWLIST.get(file)}`)
    continue
  }
  if (!REVALIDATE_IMPORT_RE.test(src) || !REVALIDATE_CALL_RE.test(src)) {
    failures.push(`${file}: has db mutations but no revalidatePublic call`)
  }
}

if (failures.length) {
  console.error('[invalidation] FAIL:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('[invalidation] OK: every mutating action invalidates the public cache')
