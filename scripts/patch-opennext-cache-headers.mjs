#!/usr/bin/env node
/**
 * Post-build patch for OpenNext Cloudflare's generated worker bundles.
 *
 * Problem: @opennextjs/cloudflare's fixISRHeaders() hardcodes
 * `stale-while-revalidate=2592000` and drops stale-if-error on every ISR cache
 * HIT, discarding the per-page Cache-Control matrix from next.config.mjs
 * (AGENTS.md §3). Observed on /sitemap.xml, /robots.txt and any page once its
 * R2 snapshot exists.
 *
 * Fix: make the rewrite preserve the original stale-while-revalidate and
 * stale-if-error values from the next.config header, keeping only the
 * s-maxage countdown (inherent to serving from the incremental cache).
 *
 * Patches two artifacts of `opennextjs-cloudflare build`:
 *   - server-functions/default/handler.mjs  ← the deployed bundle (worker.js → handler.mjs)
 *   - server-functions/default/index.mjs    ← identical code, readable form
 *
 * Run right after `opennextjs-cloudflare build` — see package.json "build" and
 * .github/workflows/deploy.yml. Idempotent; fails loudly if a bundle no longer
 * matches the expected shape.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const bundles = [
  join(root, '.open-next', 'server-functions', 'default', 'handler.mjs'),
  join(root, '.open-next', 'server-functions', 'default', 'index.mjs'),
]

/** handler.mjs is minified (no spaces) — index.mjs is formatted. */
const targets = [
  {
    name: 'handler.mjs (deployed)',
    needle: 'headers[CommonHeaders.CACHE_CONTROL]=`s-maxage=${remainingTtl}, stale-while-revalidate=2592000`',
    marker: 'stale-while-revalidate=${_swr}`',
    replacement: [
      '{let _origCc=headers[CommonHeaders.CACHE_CONTROL]??"",',
      '_swr=(_origCc.match(/stale-while-revalidate=(\\d+)/)??[])[1]??"2592000",',
      '_sife=(_origCc.match(/stale-if-error=(\\d+)/)??[])[1];',
      'headers[CommonHeaders.CACHE_CONTROL]=`s-maxage=${remainingTtl}, stale-while-revalidate=${_swr}`+(_sife?`, stale-if-error=${_sife}`:"")}',
    ].join(''),
  },
  {
    name: 'index.mjs (dev copy)',
    needle: 'headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=2592000`;',
    marker: 'stale-while-revalidate=${_swr}` + (_sife',
    replacement: [
      'const _origCc = headers[CommonHeaders.CACHE_CONTROL] ?? "";',
      'const _swr = (_origCc.match(/stale-while-revalidate=(\\d+)/) ?? [])[1] ?? "2592000";',
      'const _sife = (_origCc.match(/stale-if-error=(\\d+)/) ?? [])[1];',
      'headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=${_swr}` + (_sife ? `, stale-if-error=${_sife}` : "");',
    ].join('\n'),
  },
]

let changed = 0
for (let i = 0; i < bundles.length; i++) {
  const file = bundles[i]
  const spec = targets[i]
  const src = readFileSync(file, 'utf8')

  if (src.includes(spec.marker)) {
    console.log(`[patch-opennext-cache-headers] ${spec.name} — already applied, skip.`)
    continue
  }
  if (!src.includes(spec.needle)) {
    throw new Error(
      `[patch-opennext-cache-headers] needle not found in ${file}.\n` +
        'The @opennextjs/cloudflare bundle changed — re-check fixISRHeaders() ' +
        'and update this script. Do NOT deploy with wrong cache headers.'
    )
  }
  writeFileSync(file, src.replace(spec.needle, spec.replacement))
  changed++
  console.log(`[patch-opennext-cache-headers] ${spec.name} — patched.`)
}

if (changed === 0) {
  console.log('[patch-opennext-cache-headers] nothing to patch (both already applied).')
} else {
  console.log('[patch-opennext-cache-headers] OK — ISR HIT headers now keep next.config SWR/SIFE values.')
}
