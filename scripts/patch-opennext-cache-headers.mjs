#!/usr/bin/env node
/**
 * Post-build patch for OpenNext Cloudflare's generated worker bundle.
 *
 * Problem: @opennextjs/cloudflare's fixISRHeaders() hardcodes
 * `stale-while-revalidate=2592000` and drops stale-if-error on every ISR cache
 * HIT, discarding the per-page Cache-Control matrix from next.config.mjs
 * (AGENTS.md §3). Observed on /sitemap.xml and any page once its R2 snapshot
 * exists.
 *
 * Fix: make the rewrite preserve the original stale-while-revalidate and
 * stale-if-error values from the next.config header, keeping only the
 * s-maxage countdown (inherent to serving from the incremental cache).
 *
 * Run right after `opennextjs-cloudflare build` — see package.json "build" and
 * .github/workflows/deploy.yml. Idempotent; fails loudly if the bundle no
 * longer matches the expected shape.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, '.open-next', 'server-functions', 'default', 'index.mjs')

const src = readFileSync(target, 'utf8')

// Exact assignment emitted by @opennextjs/cloudflare (fixISRHeaders, HIT branch)
const needle =
  'headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=2592000`;'

// Marker of the already-applied patch (idempotency check)
const marker = 'stale-while-revalidate=${_swr}` + (_sife'

if (src.includes(marker)) {
  console.log('[patch-opennext-cache-headers] already applied — skip.')
  process.exit(0)
}

if (!src.includes(needle)) {
  throw new Error(
    `[patch-opennext-cache-headers] needle not found in ${target}.\n` +
      'The @opennextjs/cloudflare bundle changed — re-check fixISRHeaders() ' +
      'and update this script. Do NOT deploy with wrong cache headers.'
  )
}

const replacement = [
  'const _origCc = headers[CommonHeaders.CACHE_CONTROL] ?? "";',
  'const _swr = (_origCc.match(/stale-while-revalidate=(\\d+)/) ?? [])[1] ?? "2592000";',
  'const _sife = (_origCc.match(/stale-if-error=(\\d+)/) ?? [])[1];',
  'headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=${_swr}` + (_sife ? `, stale-if-error=${_sife}` : "");',
].join('\n')

const patched = src.replace(needle, replacement)
writeFileSync(target, patched)

console.log('[patch-opennext-cache-headers] OK — ISR HIT headers now keep next.config SWR/SIFE values.')
