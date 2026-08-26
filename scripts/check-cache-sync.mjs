#!/usr/bin/env node
/**
 * Cache-Control sync check (Phase 2.2, 2026-08-25).
 *
 * SINGLE SOURCE OF TRUTH: src/lib/cache/cache-control-values.json — imported by
 *   - src/lib/cache/cache-control-matrix.ts  (runtime: route handlers)
 *   - next.config.mjs                        (edge header rules)
 * This script fails CI if either consumer drifts:
 *   1. every JSON key must be referenced as `cc.<key>` in next.config.mjs;
 *   2. no hand-written Cache-Control literal may remain in next.config.mjs
 *      (catches reintroduced duplicates that would silently diverge);
 *   3. the runtime matrix module must import the JSON, not re-declare values.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jsonPath = join(root, 'src', 'lib', 'cache', 'cache-control-values.json')
const cfgPath = join(root, 'next.config.mjs')
const matrixPath = join(root, 'src', 'lib', 'cache', 'cache-control-matrix.ts')

const values = JSON.parse(readFileSync(jsonPath, 'utf8'))
const cfg = readFileSync(cfgPath, 'utf8')
const matrix = readFileSync(matrixPath, 'utf8')

/** @type {string[]} */
const errors = []

// 1. Every JSON key must be consumed by next.config.mjs via cc.<key>.
for (const key of Object.keys(values)) {
  if (key === '_comment') continue
  const re = new RegExp(`\\bcc\\.${key}\\b`)
  if (!re.test(cfg)) {
    errors.push(`next.config.mjs: no \`cc.${key}\` reference — value "${key}" is defined in JSON but unused/drifted`)
  }
}

// 2. No hand-written Cache-Control literals left in next.config.mjs.
//    Any quoted string carrying max-age=/no-store directives must come from cc.*.
const literalRe = /['"`]((?:public|private|no-cache|no-store)[^'"`]*(?:max-age=|no-store)[^'"`]*)['"`]/g
let m
while ((m = literalRe.exec(cfg)) !== null) {
  errors.push(`next.config.mjs: raw Cache-Control literal "${m[1]}" — use a cc.<key> reference instead`)
}

// 3. Runtime module imports the JSON single source.
if (!matrix.includes("from './cache-control-values.json'")) {
  errors.push('cache-control-matrix.ts: does not import cache-control-values.json — values may be re-declared')
}

if (errors.length > 0) {
  console.error('[check-cache-sync] FAIL — Cache-Control drift detected:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(
  `[check-cache-sync] OK — ${Object.keys(values).length - 1} Cache-Control values sourced from cache-control-values.json, no drift.`,
)
