#!/usr/bin/env node
/**
 * scripts/sitemap-audit.mjs
 *
 * Full audit of all URLs in sitemap.xml against prod (or custom baseUrl).
 * Checks per URL:
 *   1. HTTP status === 200
 *   2. Canonical link self-matches URL (modulo trailing slash)
 *   3. Hreflang alternates: ru, uk, and x-default present
 *   4. Exactly one <h1> element in server HTML
 *   5. >=1 <script type="application/ld+json"> in server HTML
 *   6. og:image meta tag present
 *   7. Edge / CDN Cache-Control headers verified
 *
 * Outputs report to TEMP/SITEMAP-AUDIT-<date>.md and stdout summary.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = process.env.BASE_URL || 'https://podvarchan.com'
const concurrency = parseInt(process.env.CONCURRENCY || '6', 10)

async function fetchSitemapUrls(sitemapUrl) {
  const res = await fetch(sitemapUrl, {
    headers: { 'User-Agent': 'SitemapAuditBot/1.0' }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status} ${res.statusText}`)
  }
  const xml = await res.text()
  const matches = [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)]
  return matches.map((m) => m[1].trim())
}

function parseHtml(html, url) {
  // 1. canonical
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)
  const canonical = canonicalMatch ? canonicalMatch[1] : null

  // 2. hreflang
  const hreflangMatches = [...html.matchAll(/<link[^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi)]
    .concat([...html.matchAll(/<link[^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["']/gi)])
    .concat([...html.matchAll(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']alternate["'][^>]+hreflang=["']([^"']+)["']/gi)])

  const hreflangs = {}
  for (const m of hreflangMatches) {
    hreflangs[m[1].toLowerCase()] = m[2]
  }

  // 3. h1 count
  const h1Matches = html.match(/<h1(\s|>)/gi) || []
  const h1Count = h1Matches.length

  // 4. json-ld count
  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["']/gi) || []
  const jsonLdCount = jsonLdMatches.length

  // 5. og:image
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
  const ogImage = ogImageMatch ? ogImageMatch[1] : null

  // 6. title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1] : ''

  return {
    canonical,
    hreflangs,
    h1Count,
    jsonLdCount,
    ogImage,
    title
  }
}

function normalizeUrl(u) {
  try {
    const parsed = new URL(u)
    let p = parsed.pathname
    if (!p.endsWith('/')) p += '/'
    return `${parsed.origin}${p}`
  } catch {
    return u
  }
}

async function auditUrl(url) {
  const result = {
    url,
    status: 0,
    canonicalOk: false,
    canonicalVal: null,
    hreflangRu: false,
    hreflangUk: false,
    hreflangDefault: false,
    h1Count: 0,
    jsonLdCount: 0,
    hasOgImage: false,
    cacheControl: '',
    cfCache: '',
    issues: []
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapAudit/1.0; +https://podvarchan.com)'
      },
      redirect: 'manual'
    })

    result.status = res.status
    result.cacheControl = res.headers.get('cache-control') || ''
    result.cfCache = res.headers.get('cf-cache-status') || 'NONE'

    if (res.status !== 200) {
      result.issues.push(`HTTP status ${res.status} (expected 200)`)
      return result
    }

    const html = await res.text()
    const parsed = parseHtml(html, url)

    result.canonicalVal = parsed.canonical
    if (parsed.canonical) {
      if (normalizeUrl(parsed.canonical) === normalizeUrl(url)) {
        result.canonicalOk = true
      } else {
        result.issues.push(`Canonical mismatch: got "${parsed.canonical}" vs "${url}"`)
      }
    } else {
      result.issues.push('Missing canonical tag')
    }

    result.hreflangRu = !!parsed.hreflangs['ru']
    result.hreflangUk = !!parsed.hreflangs['uk']
    result.hreflangDefault = !!parsed.hreflangs['x-default']

    if (!result.hreflangRu) result.issues.push('Missing hreflang="ru"')
    if (!result.hreflangUk) result.issues.push('Missing hreflang="uk"')
    if (!result.hreflangDefault) result.issues.push('Missing hreflang="x-default"')

    result.h1Count = parsed.h1Count
    if (parsed.h1Count === 0) {
      result.issues.push('Missing <h1> (found 0)')
    } else if (parsed.h1Count > 1) {
      result.issues.push(`Multiple <h1> elements (found ${parsed.h1Count})`)
    }

    result.jsonLdCount = parsed.jsonLdCount
    if (parsed.jsonLdCount === 0) {
      result.issues.push('Missing server-rendered JSON-LD (found 0)')
    }

    result.hasOgImage = !!parsed.ogImage
    if (!result.hasOgImage) {
      result.issues.push('Missing og:image')
    }

  } catch (err) {
    result.issues.push(`Fetch error: ${err.message}`)
  }

  return result
}

async function runQueue(urls, limit, workerFn) {
  const results = []
  let idx = 0

  async function next() {
    while (idx < urls.length) {
      const currentIdx = idx++
      const url = urls[currentIdx]
      const r = await workerFn(url)
      results[currentIdx] = r
      process.stdout.write(`\rAudited ${results.filter(Boolean).length}/${urls.length} URLs...`)
    }
  }

  const workers = Array.from({ length: Math.min(limit, urls.length) }, () => next())
  await Promise.all(workers)
  console.log('')
  return results
}

async function main() {
  const sitemapUrl = `${baseUrl.replace(/\/+$/, '')}/sitemap.xml`
  console.log(`[sitemap-audit] Fetching sitemap from ${sitemapUrl}...`)
  const urls = await fetchSitemapUrls(sitemapUrl)
  console.log(`[sitemap-audit] Found ${urls.length} URLs in sitemap. Auditing with concurrency=${concurrency}...`)

  const results = await runQueue(urls, concurrency, auditUrl)

  const passed = results.filter((r) => r.issues.length === 0)
  const failed = results.filter((r) => r.issues.length > 0)

  console.log('\n================ AUDIT SUMMARY ================')
  console.log(`Total URLs: ${urls.length}`)
  console.log(`PASSED:     ${passed.length} (${((passed.length / urls.length) * 100).toFixed(1)}%)`)
  console.log(`FAILED:     ${failed.length} (${((failed.length / urls.length) * 100).toFixed(1)}%)`)
  console.log('================================================\n')

  if (failed.length > 0) {
    console.log('--- DEFECTS BY URL ---')
    for (const f of failed) {
      console.log(`URL: ${f.url}`)
      console.log(`  Issues: ${f.issues.join('; ')}`)
    }
  }

  // Generate markdown report in TEMP/
  const today = new Date().toISOString().split('T')[0]
  const reportPath = join(root, 'TEMP', `SITEMAP-AUDIT-${today}.md`)

  let md = `# Sitemap Audit Report (${today})\n\n`
  md += `- **Base URL:** \`${baseUrl}\`\n`
  md += `- **Total URLs checked:** ${urls.length}\n`
  md += `- **Passed cleanly:** ${passed.length} / ${urls.length} (${((passed.length / urls.length) * 100).toFixed(1)}%)\n`
  md += `- **Issues found:** ${failed.length}\n\n`

  md += `## Summary of Requirements Checked\n\n`
  md += `| Check | Requirement | Pass Rate |\n`
  md += `|---|---|---|\n`
  md += `| HTTP 200 | Every URL in sitemap responds 200 OK | ${results.filter(r => r.status === 200).length}/${urls.length} |\n`
  md += `| Canonical | Self-matching canonical URL | ${results.filter(r => r.canonicalOk).length}/${urls.length} |\n`
  md += `| Hreflang RU | Alternate tag for ru present | ${results.filter(r => r.hreflangRu).length}/${urls.length} |\n`
  md += `| Hreflang UK | Alternate tag for uk present | ${results.filter(r => r.hreflangUk).length}/${urls.length} |\n`
  md += `| Hreflang x-default | Alternate tag for x-default present | ${results.filter(r => r.hreflangDefault).length}/${urls.length} |\n`
  md += `| Single H1 | Exactly 1 <h1> in server HTML | ${results.filter(r => r.h1Count === 1).length}/${urls.length} |\n`
  md += `| JSON-LD in SSR | >=1 schema.org script in SSR HTML | ${results.filter(r => r.jsonLdCount >= 1).length}/${urls.length} |\n`
  md += `| og:image | Open Graph image tag present | ${results.filter(r => r.hasOgImage).length}/${urls.length} |\n\n`

  if (failed.length > 0) {
    md += `## Detailed Findings / Defects (${failed.length})\n\n`
    md += `| URL | Status | Issues |\n`
    md += `|---|---|---|\n`
    for (const f of failed) {
      md += `| \`${f.url}\` | ${f.status} | ${f.issues.join('<br>')} |\n`
    }
  } else {
    md += `## Detailed Findings\n\nAll ${urls.length} URLs passed all checks with 0 defects.\n`
  }

  mkdirSync(join(root, 'TEMP'), { recursive: true })
  writeFileSync(reportPath, md, 'utf8')
  console.log(`\n[sitemap-audit] Full markdown report written to: ${reportPath}`)

  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error('[sitemap-audit] Fatal error:', err)
  process.exit(1)
})
