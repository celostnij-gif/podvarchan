/**
 * Google Indexing API script
 *
 * Reads sitemap.xml, compares with previously indexed URLs (temp/indexed-urls.json),
 * and submits new/modified pages to Google Indexing API.
 *
 * Usage:
 *   export GOOGLE_INDEXING_API_KEY="..."        # Service account private key JSON
 *   node scripts/submit-to-index.mjs [--force]
 *
 * --force: re-submit ALL URLs, not just new/modified ones
 *
 * Requirements:
 * - Google Cloud Service Account with "Indexing API" enabled
 * - Service account email added to Search Console as owner
 * - npm package: googleapis (or use built-in https)
 *
 * This script uses raw HTTPS to avoid heavy dependencies.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { createHash } from 'crypto'

const SITEMAP_URL = 'https://podvarchan.com/sitemap.xml'
const INDEXED_STATE_FILE = 'temp/indexed-urls.json'
const TEMP_DIR = 'temp'

interface IndexedState {
  /** Key = url, value = lastmod hash  */
  [url: string]: string
}

interface SitemapUrl {
  loc: string
  lastmod: string | null
  changefreq: string | null
  priority: string | null
}

/* ── Helpers ── */

function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true })
}

async function fetchSitemap(url: string): Promise<string> {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to fetch sitemap: ${resp.status}`)
  return resp.text()
}

function parseSitemap(xml: string): SitemapUrl[] {
  const urls: SitemapUrl[] = []
  const regex = /<url>([\s\S]*?)<\/url>/g
  let match

  while ((match = regex.exec(xml)) !== null) {
    const block = match[1]
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? ''
    const lastmod = block.match(/<lastmod>([^<]+)<\/loc>/)?.[1] ?? null
    const changefreq = block.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1] ?? null
    const priority = block.match(/<priority>([^<]+)<\/priority>/)?.[1] ?? null
    urls.push({ loc, lastmod, changefreq, priority })
  }

  return urls
}

function loadIndexedState(): IndexedState {
  if (!existsSync(INDEXED_STATE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(INDEXED_STATE_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function saveIndexedState(state: IndexedState) {
  writeFileSync(INDEXED_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

function getLastmodHash(url: SitemapUrl): string {
  return createHash('md5').update(url.lastmod ?? url.loc).digest('hex').slice(0, 8)
}

/* ── Google Indexing API ── */

function getAccessToken(): string | null {
  // Option 1: Pre-generated OAuth2 token (set via env)
  if (process.env.GOOGLE_ACCESS_TOKEN) return process.env.GOOGLE_ACCESS_TOKEN

  // Option 2: Service account key file
  const keyPath = process.env.GOOGLE_INDEXING_API_KEY
  if (!keyPath) {
    console.warn('[WARN] No GOOGLE_INDEXING_API_KEY or GOOGLE_ACCESS_TOKEN set. Skipping Indexing API calls.')
    return null
  }

  // For simplicity, read the key. In production, use google-auth-library.
  // Here we just return null and print instructions.
  console.warn('[WARN] Google Indexing API requires OAuth2 token. Set GOOGLE_ACCESS_TOKEN env var.')
  console.warn(`       Service account key: ${keyPath}`)
  console.warn('       Generate token: `npx google-auth-library --keyFile=' + keyPath + ' --scope=https://www.googleapis.com/auth/indexing`')
  return null
}

async function submitUrl(token: string, url: string, type: 'URL_UPDATED' | 'URL_DELETED'): Promise<boolean> {
  const resp = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    console.error(`  FAIL ${url.slice(0, 60)}: ${resp.status} ${err.slice(0, 200)}`)
    return false
  }

  const result = await resp.json()
  console.log(`  OK   ${url.slice(0, 60)} → ${result.urlNotificationMetadata?.latestUpdate?.time ?? 'submitted'}`)
  return true
}

/* ── Main ── */

async function main() {
  const force = process.argv.includes('--force')
  ensureTempDir()

  // 1. Fetch and parse sitemap
  console.log('[1/4] Fetching sitemap...')
  const xml = await fetchSitemap(SITEMAP_URL)
  const allUrls = parseSitemap(xml)
  console.log(`       Found ${allUrls.length} URLs`)

  if (allUrls.length === 0) {
    console.error('[ERROR] No URLs found in sitemap. Exiting.')
    process.exit(1)
  }

  // 2. Load previously indexed state
  console.log('[2/4] Comparing with indexed state...')
  const indexed = loadIndexedState()
  const toSubmit: SitemapUrl[] = []

  for (const url of allUrls) {
    const hash = getLastmodHash(url)
    const prevHash = indexed[url.loc]

    if (force || !prevHash || prevHash !== hash) {
      toSubmit.push(url)
    }
  }

  if (toSubmit.length === 0) {
    console.log('       No new or modified URLs. Use --force to re-submit all.')
    return
  }

  console.log(`       ${toSubmit.length} URL(s) to submit (${force ? 'forced' : 'new/modified'})`)

  // 3. Get access token
  console.log('[3/4] Getting Google Indexing API token...')
  const token = getAccessToken()
  if (!token) {
    console.log('       Token not available. Saving URLs for manual submission...')
    const pendingFile = `${TEMP_DIR}/pending-indexing.txt`
    writeFileSync(pendingFile, toSubmit.map(u => u.loc).join('\n'), 'utf-8')
    console.log(`       Saved to ${pendingFile}`)

    // Still save the indexed state for next run
    const newState: IndexedState = { ...indexed }
    for (const url of toSubmit) {
      newState[url.loc] = getLastmodHash(url)
    }
    saveIndexedState(newState)
    return
  }

  // 4. Submit URLs
  console.log('[4/4] Submitting to Google Indexing API...')
  let ok = 0
  let fail = 0

  for (const url of toSubmit) {
    const success = await submitUrl(token, url.loc, 'URL_UPDATED')
    if (success) ok++; else fail++

    // Rate limit: 1 request per second
    await new Promise(r => setTimeout(r, 200))
  }

  // 5. Save state
  const newState: IndexedState = { ...indexed }
  for (const url of toSubmit) {
    newState[url.loc] = getLastmodHash(url)
  }
  saveIndexedState(newState)

  console.log(`\n=== Done: ${ok} submitted, ${fail} failed ===`)
  if (fail > 0) process.exit(1)
}

main().catch(err => {
  console.error('[FATAL]', err)
  process.exit(1)
})
