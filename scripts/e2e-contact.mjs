#!/usr/bin/env node
/**
 * E2E test for the public contact form (FINAL_ROADMAP_STANDALONE.md §5.7).
 *
 * Runs an automated POST -> 200 -> D1 SELECT (contact_leads + lead_events)
 * cycle against an environment configured with the official Cloudflare
 * Turnstile ALWAYS-PASS test keys — NOT the prod keys:
 *
 *   TURNSTILE_SECRET_KEY          = 1x0000000000000000000000000000000AA
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY = 1x00000000000000000000AA
 *
 * The token `XXXX.DUMMY.TOKEN.XXXX` is the one Cloudflare documents as accepted
 * by the always-pass test secret. The same dummy token sent to PROD (real
 * secret) is REJECTED by siteverify -> route returns 400 and no row is written.
 * That 400 is precisely the "в проде поведение не меняется" guarantee — a prod
 * run of this test never touches D1 (validation/secret gate happens first).
 *
 * Modes:
 *   default / --expect 200  → assert a real INSERT + lead event happened
 *                             (test/preview env with always-pass keys).
 *   --expect-reject         → assert the dummy token is rejected with 400
 *                             (prod-safe check; keeps requests ≤3 per IP and
 *                             never writes to D1).
 *
 * DB verification (--verify-db) shells out to `wrangler d1 execute --local`
 * to SELECT the created row + lead event, then removes the test rows (unless
 * --keep is passed) so repeated runs stay idempotent.
 *
 * Usage:
 *   node scripts/e2e-contact.mjs --base-url http://127.0.0.1:8787 --verify-db
 *   node scripts/e2e-contact.mjs --base-url https://podvarchan.com --expect-reject
 *
 * Options:
 *   --base-url <url>    target (default http://127.0.0.1:8787)
 *   --expect 200|400    expected status for the valid-form + dummy-token POST
 *                       (default 200; --expect-reject is shorthand for 400)
 *   --verify-db         verify row in contact_leads + lead_events via D1
 *   --d1-cmd <prefix>   D1 command prefix for verification
 *                       (default "npx wrangler d1 execute podvarchan --local")
 *   --keep              do not delete the created test rows
 *   --skip-rate-limit   skip the 429 burst scenario
 *   --verbose           print per-request details
 */

import { spawnSync } from 'node:child_process'

const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'
const UA = 'e2e-contact/1.0'
const FAIL_MSG = 'Подтвердите, что вы не робот.'

function parseArgs(argv) {
  const opts = {
    baseUrl: 'http://127.0.0.1:8787',
    expect: 200,
    verifyDb: false,
    d1Cmd: ['npx', 'wrangler', 'd1', 'execute', 'podvarchan', '--local'],
    keep: false,
    skipRateLimit: false,
    verbose: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '--base-url': opts.baseUrl = argv[++i]; break
      case '--expect': opts.expect = Number(argv[++i]); break
      case '--expect-reject': opts.expect = 400; break
      case '--verify-db': opts.verifyDb = true; break
      case '--d1-cmd': opts.d1Cmd = argv[++i].split(' '); break
      case '--keep': opts.keep = true; break
      case '--skip-rate-limit': opts.skipRateLimit = true; break
      case '--verbose': opts.verbose = true; break
      default: throw new Error(`Unknown option: ${a}`)
    }
  }
  return opts
}

function log(opts, msg) {
  if (opts.verbose) console.log(`[e2e] ${msg}`)
}

function d1(opts, sql) {
  const res = spawnSync(opts.d1Cmd[0], [...opts.d1Cmd.slice(1), '--json', '--command', sql], {
    encoding: 'utf8',
    timeout: 120000,
  })
  if (res.status !== 0) {
    throw new Error(`d1 execute failed (${res.status}): ${res.stderr?.trim() || res.stdout?.trim()}`)
  }
  let parsed
  try {
    parsed = JSON.parse(res.stdout)
  } catch {
    throw new Error(`d1 execute returned non-JSON: ${res.stdout.slice(0, 400)}`)
  }
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  return arr[0]?.results ?? []
}

async function post(opts, path, body, headers = {}) {
  const url = `${opts.baseUrl.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': UA,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
  let json = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, json }
}

function uniqueIp(seed) {
  // TEST-NET-3 (RFC 5737): 203.0.113.0/24 — never routable, isolated per scenario
  return `203.0.113.${10 + (seed % 240)}`
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`)
    process.exitCode = 1
  } else {
    console.log(`ok: ${msg}`)
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const base = opts.baseUrl.replace(/\/$/, '')
  const ts = Date.now()
  const rand = Math.random().toString(16).slice(2, 6)
  const marker = `E2E-CONTACT-${ts}-${rand}`
  const payload = {
    name: 'E2E Test',
    email: `e2e.${ts}.${rand}@example.com`,
    message: marker,
    turnstileToken: DUMMY_TOKEN,
  }

  console.log(`[e2e] target: ${base} | expect valid+token -> ${opts.expect} | marker: ${marker}`)

  /* ── 1. Positive: valid form + always-pass dummy token ── */
  const pos = await post(opts, '/api/contact/', payload, { 'x-forwarded-for': uniqueIp(1) })
  log(opts, `positive status=${pos.status}`)

  if (pos.status === 400 && pos.json?.error === FAIL_MSG && opts.expect === 200) {
    console.error(
      'FAIL: dummy token was rejected. Is this environment using the always-pass test secret?',
    )
    console.error('  TURNSTILE_SECRET_KEY must be 1x0000000000000000000000000000000AA in the TEST env.')
    console.error('  On prod this 400 is expected — run with --expect-reject to assert it.')
    process.exitCode = 1
    return
  }

  assert(pos.status === opts.expect, `valid form + dummy token -> ${pos.status} (expected ${opts.expect})`)
  if (opts.expect === 200) {
    assert(!!pos.json?.success, 'response body has success:true')
  } else {
    assert(pos.json?.error === FAIL_MSG, `dummy token rejected with "${FAIL_MSG}"`)
  }

  /* ── Prod-reject mode: nothing else touches D1, stop here ── */
  if (opts.expect === 400) {
    // Basic validation still returns 400 on prod without writing anything.
    const bad = await post(opts, '/api/contact/', {}, { 'x-forwarded-for': uniqueIp(2) })
    assert(bad.status === 400, `empty body -> ${bad.status} (expected 400)`)
    return
  }

  /* ── 2. DB verification (test env only) ── */
  if (opts.verifyDb) {
    try {
      const rows = d1(opts, `SELECT id, message FROM contact_leads WHERE message = '${marker}'`)
      assert(rows.length >= 1, `contact_leads row created (found ${rows.length})`)

      const leadId = rows[0].id
      const events = d1(opts, `SELECT type FROM lead_events WHERE lead_id = '${leadId}'`)
      assert(events.length >= 1, `lead_events row exists (found ${events.length})`)
      log(opts, `lead_events types: ${events.map((e) => e.type).join(', ')}`)

      if (!opts.keep) {
        const ids = rows.map((r) => `'${r.id}'`).join(', ')
        d1(opts, `DELETE FROM lead_events WHERE lead_id IN (${ids})`)
        d1(opts, `DELETE FROM contact_leads WHERE id IN (${ids})`)
        log(opts, 'test rows cleaned up')
      }
    } catch (err) {
      assert(false, `DB verification failed: ${err.message}`)
    }
  }

  /* ── 3. Negative scenarios (all rejected before D1 write) ── */
  const badCases = [
    { label: 'empty object', body: {} },
    { label: 'missing name', body: { email: 'x@y.zz', message: '0123456789' } },
    { label: 'invalid email', body: { name: 'E2E', email: 'nope', message: '0123456789' } },
    { label: 'short message', body: { name: 'E2E', email: 'x@y.zz', message: 'short' } },
    { label: 'missing token', body: { name: 'E2E', email: 'x@y.zz', message: '0123456789' } },
    { label: 'garbage token', body: { name: 'E2E', email: 'x@y.zz', message: '0123456789', turnstileToken: 'garbage' } },
  ]
  for (let i = 0; i < badCases.length; i++) {
    const c = badCases[i]
    const r = await post(opts, '/api/contact/', c.body, { 'x-forwarded-for': uniqueIp(10 + i) })
    assert(r.status === 400, `negative "${c.label}" -> ${r.status} (expected 400)`)
  }

  /* ── 4. Rate limit: 4 rapid requests from a fresh IP -> a 429 must appear ── */
  if (!opts.skipRateLimit) {
    const rlIp = uniqueIp(99)
    let saw429 = false
    for (let i = 0; i < 4; i++) {
      const r = await post(opts, '/api/contact/', payload, { 'x-forwarded-for': rlIp })
      log(opts, `rate-limit burst ${i + 1} -> ${r.status}`)
      if (r.status === 429) saw429 = true
    }
    assert(saw429, 'rate limit triggers 429 within 4 rapid requests')
  }

  console.log(`[e2e] done (${process.exitCode ? 'FAILED' : 'PASS'})`)
}

main().catch((err) => {
  console.error('FAIL:', err.message)
  process.exitCode = 1
})
