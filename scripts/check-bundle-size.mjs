#!/usr/bin/env node
// Bundle size gate — CI fail-fast before deploy (AGENTS.md §1: ~3 MiB gzip per worker).
// Usage: node scripts/check-bundle-size.mjs --path <handler.mjs> [--warn <bytes>] [--fail <bytes>]
// Defaults: warn 2.5 MiB gzip, fail 2.9 MiB gzip.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const args = process.argv.slice(2)
const opt = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

const path = opt('--path') ?? '.open-next/server-functions/default/handler.mjs'
const warnBytes = Number(opt('--warn') ?? 2.5 * 1024 * 1024)
const failBytes = Number(opt('--fail') ?? 2.9 * 1024 * 1024)

const raw = readFileSync(path)
const gz = gzipSync(raw)
const miB = (b) => (b / 1024 / 1024).toFixed(2)

console.log(`[bundle-size] ${path}: raw ${miB(raw.length)} MiB, gzip ${miB(gz.length)} MiB`)

if (gz.length > failBytes) {
  console.error(`[bundle-size] FAIL: gzip ${miB(gz.length)} MiB > limit ${miB(failBytes)} MiB`)
  process.exit(1)
}
if (gz.length > warnBytes) {
  console.warn(`[bundle-size] WARN: gzip ${miB(gz.length)} MiB > warn ${miB(warnBytes)} MiB`)
}
console.log('[bundle-size] OK')
