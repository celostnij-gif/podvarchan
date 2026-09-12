#!/usr/bin/env node
/**
 * scripts/warmup.mjs
 *
 * Warm up every URL in sitemap.xml right after deploy (AGENTS.md §3.5:
 * "Purge без последующего прогрева — незавершённая операция").
 *
 * Runs AFTER scripts/purge-zone-cache.mjs in deploy.yml: the purge wipes the
 * zone cache for structural pages, so the cold renders must happen during the
 * deploy — not for the first real visitor / Googlebot.
 *
 * Per URL:
 *   - plain GET (no cache-busting headers — a no-cache request would bypass
 *     the edge cache and never warm it);
 *   - up to MAX_ATTEMPTS attempts with a delay: cold renders of blog
 *     posts/categories occasionally exceed the 10ms CPU budget and die with
 *     Error 1102 (HTTP 503, 17-byte body "error code: 1102"); a retry usually
 *     renders fine, and the success populates the edge cache;
 *   - 4xx (except 429) fail immediately — retrying cannot fix them.
 *
 * Exit code 1 if any URL never returned 200 after all attempts (persistent
 * 1102 = real defect that real visitors would hit).
 *
 * Usage (CI + local): node scripts/warmup.mjs
 * Env: WARMUP_BASE_URL (default https://podvarchan.com),
 *      WARMUP_CONCURRENCY (default 4 — low on purpose, §3.5 anti-stampede),
 *      WARMUP_ATTEMPTS (default 6), WARMUP_TIMEOUT_MS (default 45000),
 *      WARMUP_RETRY_DELAY_MS (default 2500 — база эскалации ретраев),
 *      WARMUP_PACING_MS (default 250), WARMUP_RESCUE_PAUSE_MS (default 45000),
 *      WARMUP_BREAKER_THRESHOLD (default 5), WARMUP_BREAKER_PAUSE_MS (default 30000).
 */
const BASE = (process.env.WARMUP_BASE_URL ?? 'https://podvarchan.com').replace(/\/+$/, '')
const CONCURRENCY = parseInt(process.env.WARMUP_CONCURRENCY ?? '4', 10)
const MAX_ATTEMPTS = parseInt(process.env.WARMUP_ATTEMPTS ?? '6', 10)
const TIMEOUT_MS = parseInt(process.env.WARMUP_TIMEOUT_MS ?? '45000', 10)
const RETRY_DELAY_MS = parseInt(process.env.WARMUP_RETRY_DELAY_MS ?? '2500', 10)
// Anti-stampede: пауза каждого воркера между URL. Без неё раннер бьёт по
// оринжу со скоростью ответов — 197 холодных рендеров + ретраи залпом.
const PACING_MS = parseInt(process.env.WARMUP_PACING_MS ?? '250', 10)
// Пауза между rescue-проходами: изоляты «остывают» дольше одного прохода
// очереди; пауза 5с никакого остывания не давала (инцидент 2026-09-12:
// окно 503/1102 длилось ~10 минут, оба rescue-прохода сгорели в нём).
const RESCUE_PAUSE_MS = parseInt(process.env.WARMUP_RESCUE_PAUSE_MS ?? '45000', 10)
// Circuit breaker: N последовательных неудач очереди -> пауза, чтобы не
// кормить деградировавший оринж новой нагрузкой.
const BREAKER_THRESHOLD = parseInt(process.env.WARMUP_BREAKER_THRESHOLD ?? '5', 10)
const BREAKER_PAUSE_MS = parseInt(process.env.WARMUP_BREAKER_PAUSE_MS ?? '30000', 10)
// Эскалация задержки между попытками одного URL: фиксированные 2.5с сжигали
// все 6 попыток внутри ~15 секунд — целиком внутри деградационного окна.
const BACKOFF_MS = [RETRY_DELAY_MS, RETRY_DELAY_MS * 2, RETRY_DELAY_MS * 3, RETRY_DELAY_MS * 5, RETRY_DELAY_MS * 6]

// Aggregates purged by deploy-purge-paths.json that are not sitemap entries.
const EXTRA_PATHS = ['/robots.txt', '/llms.txt', '/llms-full.txt']

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchSitemapUrls() {
  let lastErr
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/sitemap.xml`, {
        headers: { 'User-Agent': 'WarmupBot/1.0 (+https://podvarchan.com)' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const xml = await res.text()
      const matches = [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)]
      return matches.map((m) => m[1].trim())
    } catch (err) {
      lastErr = err
      if (attempt < 3) await sleep(RETRY_DELAY_MS)
    }
  }
  throw lastErr
}

async function warmOnce(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WarmupBot/1.0 (+https://podvarchan.com)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (res.status >= 500) {
      // Захват тела ошибки: Cloudflare отдаёт 17-байтовый "error code: 1102"
      // (лимит CPU изолята) — без этого в summary был ложный «status 0» без
      // причины и 1102-инцидент выглядел как необъяснимый сетевой сбой.
      let bodyText = ''
      try { bodyText = (await res.text()).slice(0, 64) } catch { /* пустое тело */ }
      return { status: res.status, err: bodyText || null }
    }
    // Drain the body so the connection is released and the response is
    // actually rendered/inserted into cache.
    await res.arrayBuffer()
    return { status: res.status, err: null }
  } catch (err) {
    // Network error / timeout — surface the cause (ECONNRESET, ETIMEDOUT,
    // connect timeout …) so a runner-side network window is distinguishable
    // from server-side cold-render failures.
    return { status: 0, err: err?.cause?.code ?? err?.code ?? err?.message ?? 'error' }
  }
}

async function warmUrl(url) {
  let lastErr = null
  let lastStatus = 0
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { status, err } = await warmOnce(url)
    lastStatus = status
    lastErr = err
    if (status === 200) return { url, status, attempts: attempt, ok: true, err: null }
    if (status >= 400 && status < 500 && status !== 429) {
      return { url, status, attempts: attempt, ok: false, err: null } // not retryable
    }
    if (attempt < MAX_ATTEMPTS) await sleep(BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)])
  }
  // ФИКС: раньше статус жёстко писался как 0 и err терялся — HTTP 503 (1102)
  // выглядел в summary как «last status 0» без причины.
  return { url, status: lastStatus, attempts: MAX_ATTEMPTS, ok: false, err: lastErr }
}

async function runQueue(urls) {
  const results = []
  let idx = 0
  let consecutiveFailures = 0 // queue-wide, сброс любым успехом
  async function worker() {
    while (idx < urls.length) {
      const i = idx++
      const r = await warmUrl(urls[i])
      results[i] = r
      if (r.ok) {
        consecutiveFailures = 0
      } else {
        consecutiveFailures++
        if (consecutiveFailures >= BREAKER_THRESHOLD) {
          console.log(
            `\n[warmup] ${consecutiveFailures} failures подряд -> cool-down очереди ${BREAKER_PAUSE_MS / 1000}s` +
              ` (не кормим деградировавший оринж новой нагрузкой)`,
          )
          await sleep(BREAKER_PAUSE_MS)
          consecutiveFailures = 0
        }
      }
      if (PACING_MS > 0) await sleep(PACING_MS)
      const done = results.filter(Boolean).length
      const ok = results.filter(Boolean).filter((r) => r.ok).length
      process.stdout.write(`\rWarmed ${done}/${urls.length} (ok ${ok})...`)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker))
  console.log('')
  return results
}

const sitemapUrls = await fetchSitemapUrls()
const urls = [...EXTRA_PATHS.map((p) => `${BASE}${p}`), ...sitemapUrls]
console.log(
  `[warmup] ${urls.length} URLs (${sitemapUrls.length} sitemap + ${EXTRA_PATHS.length} extra), ` +
    `concurrency=${CONCURRENCY}, attempts<=${MAX_ATTEMPTS}, timeout=${TIMEOUT_MS}ms`,
)

const results = await runQueue(urls)
const failed = results.filter((r) => !r.ok)
const retried = results.filter((r) => r.ok && r.attempts > 1)

// Rescue passes for cold-render 1102: an isolate that keeps missing the CPU
// budget is throttled state, not a broken page — after the burst moves on,
// the same render usually fits. Spaced-out single retries convert a large
// share of stragglers; remaining failures are real render-path defects.
// Two passes with a pause between them: cold isolates "cool down" on a
// timescale longer than one queue sweep.
for (let pass = 1; pass <= 2; pass++) {
  if (failed.every((r) => r.ok)) break
  const pending = failed.filter((r) => !r.ok)
  console.log(`[warmup] rescue pass ${pass} for ${pending.length} URL(s), пауза ${RESCUE_PAUSE_MS / 1000}s перед проходом...`)
  await sleep(RESCUE_PAUSE_MS)
  const rescued = await runQueue(pending.map((f) => f.url))
  for (let i = 0; i < pending.length; i++) {
    if (rescued[i]?.ok) {
      const target = failed.find((f) => f.url === pending[i].url)
      if (target) Object.assign(target, rescued[i])
    }
  }
}

const stillFailed = failed.filter((r) => !r.ok)

console.log('================ WARMUP SUMMARY ================')
console.log(`Total: ${results.length}`)
console.log(`Warmed on first try: ${results.length - retried.length - results.filter((r) => !r.ok).length}`)
console.log(`Warmed after retries (1102 lottery): ${retried.length}`)
console.log(`FAILED after all attempts: ${stillFailed.length}`)
if (stillFailed.length > 0) {
  const statusCounts = {}
  for (const r of stillFailed) statusCounts[r.status] = (statusCounts[r.status] || 0) + 1
  console.log(
    'Failure status distribution: ' +
      Object.entries(statusCounts).map(([code, n]) => `${code} x${n}`).join(', '),
  )
}
console.log('================================================')

if (retried.length > 0) {
  console.log('--- URLs that needed retries (cold-render CPU risk) ---')
  for (const r of retried) console.log(`  ${r.attempts} attempts: ${r.url}`)
}
if (stillFailed.length > 0) {
  console.log('--- FAILED URLs (not deploy-blocking; input for render-path work) ---')
  for (const r of stillFailed) {
    console.log(`  last status ${r.status}${r.err ? ` (${r.err})` : ''}: ${r.url}`)
  }
  process.exitCode = 1
}
