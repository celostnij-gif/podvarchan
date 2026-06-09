#!/usr/bin/env node

/**
 * SEO-regression test runner.
 * Запуск: node scripts/seo-regression.mjs
 *       : SEO_MODE=live node scripts/seo-regression.mjs
 *
 * static mode — перевіряє URL структуру (без запуску сервера)
 * live mode   — краулінг сайту через fetch (потрібен next start)
 *
 * За замовчуванням: static
 */

const BASE_URL = process.env.SEO_BASE_URL || 'http://localhost:3000'
const MODE = process.env.SEO_MODE || 'static'
const LIVE_RETRIES = Number(process.env.SEO_RETRIES ?? '3')
const LIVE_DELAY_MS = Number(process.env.SEO_DELAY_MS ?? '1000')
const LIVE_USER_AGENT = process.env.SEO_USER_AGENT ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'

/* ── URL-и для перевірки (статичні, відомі) ── */

const LOCALES = ['ru', 'uk']

const STATIC_PATHS = [
  '',
  'uslugi/',
  'ob-avtore/',
  'metod/',
  'blog/',
  'faq/',
  'kontakty/',
  'politika-konfidentsialnosti/',
  'disclaimer/',
  'tseny/',
]

const SERVICE_SLUGS = [
  'gipnoterapiya-onlayn',
  'trevoga-i-panicheskiye-ataki',
  'rabota-s-podsoznaniem',
  'samosabotazh-i-bloki',
  'emotsionalnoye-vygoraniye',
  'neyverennost-i-strakh-provala',
  'psikhosomatika',
  'lichnostnyy-krizis',
  'tsifrovoy-detoks-i-gadzhet-zavisimost',
]

const BLOG_CATEGORY_SLUGS = [
  'trevoga',
  'gipnoterapiya',
  'samosabotazh',
  'podsoznanie',
  'psikhosomatika',
  'neyverennost',
  'tsifrovoy-detoks',
]

const BLOG_POST_SLUGS = [
  'chto-takoe-gipnoterapiya',
  'kak-rabotaet-gipnoz',
  'trevoga-prichiny-i-simptomy',
  'kak-spravitsya-s-trevogoy',
  'panicheskiye-ataki-chto-delat',
  'chto-takoe-samosabotazh',
  'samosabotazh-prichiny',
  'emotsionalnoye-vygoraniye-simptomy',
  'vnutrenniy-kritik',
  'podavlennyye-emotsii',
  'eksistentsialnyy-krizis',
  'gipnoterapiya-onlayn-kak-prokhodit',
]

function getAllUrls() {
  const urls = ['/']  // root redirect

  for (const locale of LOCALES) {
    for (const path of STATIC_PATHS) {
      urls.push(`/${locale}/${path}`)
    }
    for (const slug of SERVICE_SLUGS) {
      urls.push(`/${locale}/uslugi/${slug}/`)
    }
    for (const slug of BLOG_CATEGORY_SLUGS) {
      urls.push(`/${locale}/blog/kategoriya/${slug}/`)
    }
    for (const slug of BLOG_POST_SLUGS) {
      urls.push(`/${locale}/blog/${slug}/`)
    }
  }

  return urls
}

/**
 * @param {string} url
 * @param {string} html
 * @param {number} status
 * @returns {{ url: string, status: number, issues: Array<{ type: string, message: string }>, passed: boolean }}
 */
function checkHtmlSeo(url, html, status) {
  /** @type {Array<{ type: string, message: string }>} */
  const issues = []

  /* ── Статус ── */
  if (status >= 400) {
    issues.push({ type: 'critical', message: `HTTP ${status}` })
  }

  /* ── Title ── */
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  if (!title) {
    issues.push({ type: 'critical', message: 'Відсутній <title>' })
  } else if (title.length < 10) {
    issues.push({ type: 'warning', message: `Заголовок занадто короткий: "${title.substring(0, 30)}..."` })
  } else if (title.includes('undefined') || title.includes('null') || title.includes('PLACEHOLDER')) {
    issues.push({ type: 'critical', message: `Заголовок містить невалідний текст: "${title.substring(0, 40)}..."` })
  }

  /* ── Meta description ── */
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
  const description = descMatch ? descMatch[1].trim() : ''
  if (!description) {
    issues.push({ type: 'critical', message: 'Відсутня meta description' })
  } else if (description.includes('undefined') || description.includes('null') || description.includes('PLACEHOLDER')) {
    issues.push({ type: 'critical', message: `Description містить невалідний текст: "${description.substring(0, 40)}..."` })
  } else if (description.length < 80) {
    issues.push({ type: 'warning', message: `Description занадто короткий (${description.length} символів)` })
  }

  /* ── Canonical ── */
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
  if (!canonicalMatch) {
    issues.push({ type: 'warning', message: 'Відсутній canonical' })
  }

  /* ── Hreflang ── */
  const hreflangMatches = html.match(/<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']*)["'][^>]*href=["']([^"']*)["']/gi)
  if (!hreflangMatches || hreflangMatches.length < 2) {
    issues.push({ type: 'warning', message: `Недостатньо hreflang (знайдено: ${hreflangMatches ? hreflangMatches.length : 0})` })
  }

  /* ── JSON-LD ── */
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["']>([^<]+)<\/script>/gi)
  if (!jsonLdMatch) {
    issues.push({ type: 'warning', message: 'Відсутній JSON-LD schema' })
  }

  /* ── H1 ── */
  const h1Matches = html.match(/<h1[^>]*>/gi)
  if (!h1Matches || h1Matches.length === 0) {
    issues.push({ type: 'warning', message: 'Відсутній H1' })
  } else if (h1Matches.length > 1) {
    issues.push({ type: 'warning', message: `Знайдено ${h1Matches.length} H1 (рекомендується 1)` })
  }

  /* ── Open Graph ── */
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)
  if (!ogTitle) issues.push({ type: 'warning', message: 'Відсутній og:title' })
  if (!ogDesc) issues.push({ type: 'warning', message: 'Відсутній og:description' })
  if (!ogImage) issues.push({ type: 'warning', message: 'Відсутній og:image' })

  /* ── Robots meta ── */
  const robotsMeta = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)
  if (robotsMeta && robotsMeta[1].includes('noindex')) {
    // Для адмінки це норм, для публічних сторінок — проблема
    if (!url.includes('/admin/')) {
      issues.push({ type: 'warning', message: 'Містить noindex' })
    }
  }

  const criticalCount = issues.filter(i => i.type === 'critical').length

  return {
    url,
    status,
    issues,
    passed: criticalCount === 0,
  }
}

/* ── Статична перевірка (без запуску сервера) ── */

/**
 * @returns {Array<{ url: string, status: number, issues: Array<{ type: string, message: string }>, passed: boolean }>}
 */
function staticCheck() {
  const urls = getAllUrls()
  const results = []

  // У статичному режимі перевіряємо тільки URL структуру
  for (const url of urls) {
    /** @type {Array<{ type: string, message: string }>} */
    const issues = []

    // Перевірки URL-структури
    if (!url.startsWith('/')) {
      issues.push({ type: 'critical', message: 'URL не починається з /' })
    }

    // Перевірка наявності locale
    if (url !== '/') {
      const hasLocale = LOCALES.some(l => url.startsWith(`/${l}/`) || url === `/${l}`)
      if (!hasLocale) {
        issues.push({ type: 'critical', message: 'URL не містить локалі (ru/uk)' })
      }
    }

    results.push({
      url,
      status: 0,
      issues,
      passed: issues.filter(i => i.type === 'critical').length === 0,
    })
  }

  return results
}

/* ── Live перевірка через HTTP ── */

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * @param {string} url
 * @returns {Promise<{ html: string, status: number }>}
 */
async function fetchPage(url) {
  const fullUrl = `${BASE_URL}${url}`

  for (let attempt = 1; attempt <= LIVE_RETRIES; attempt++) {
    const resp = await fetch(fullUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': LIVE_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,uk-UA;q=0.8,uk;q=0.7,en;q=0.6',
      },
    })
    const html = await resp.text()

    if (![429, 503].includes(resp.status) || attempt === LIVE_RETRIES) {
      return { html, status: resp.status }
    }

    await sleep(750 * attempt)
  }

  throw new Error('fetch retry loop exhausted')
}

/**
 * @returns {Promise<Array<{ url: string, status: number, issues: Array<{ type: string, message: string }>, passed: boolean }>>}
 */
async function liveCheck() {
  const urls = getAllUrls()
  const results = []

  console.log(`\n🔍 Краулінг ${urls.length} сторінок...\n`)

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    process.stdout.write(`  [${i + 1}/${urls.length}] ${url} ... `)

    try {
      const { html, status } = await fetchPage(url)
      const result = checkHtmlSeo(url, html, status)
      results.push(result)

      if (result.passed) {
        console.log('✅')
      } else {
        console.log(`❌ (${result.issues.length} проблем)`)
        for (const issue of result.issues) {
          console.log(`     ${issue.type === 'critical' ? '🔴' : '🟡'} ${issue.message}`)
        }
      }
    } catch (err) {
      console.log(`❌ ПОМИЛКА: ${err.message}`)
      results.push({
        url,
        status: 0,
        issues: [{ type: 'critical', message: err.message }],
        passed: false,
      })
    }

    // Невелика затримка, щоб не перевантажувати сервер
    await sleep(LIVE_DELAY_MS)
  }

  return results
}

/* ── Головна функція ── */

async function main() {
  console.log('═══════════════════════════════════════════════')
  console.log('     SEO-REGRESSION TEST')
  console.log(`  Mode: ${MODE}`)
  console.log(`  Date: ${new Date().toISOString().split('T')[0]}`)
  console.log('═══════════════════════════════════════════════')

  const results = MODE === 'live' ? await liveCheck() : staticCheck()

  /* ── Підрахунок ── */
  const total = results.length
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalCritical = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'critical').length, 0)
  const totalWarnings = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'warning').length, 0)

  /* ── Звіт ── */
  console.log('\n═══════════════════════════════════════════════')
  console.log('     РЕЗУЛЬТАТИ')
  console.log('═══════════════════════════════════════════════')
  console.log(`  Всього сторінок:  ${total}`)
  console.log(`  Пройдено:         ${passed} ✅`)
  console.log(`  Провалено:        ${failed} ❌`)
  console.log(`  Критичних помилок: ${totalCritical}`)
  console.log(`  Попереджень:      ${totalWarnings}`)

  /* ── Деталі невдалих ── */
  if (failed > 0) {
    console.log('\n--- ❌ ДЕТАЛІ ПРОВАЛЕНИХ СТОРІНОК ---')
    for (const result of results) {
      if (!result.passed) {
        console.log(`\n  ${result.url}`)
        for (const issue of result.issues) {
          console.log(`    ${issue.type === 'critical' ? '🔴' : '🟡'} ${issue.message}`)
        }
      }
    }
  }

  /* ── Exit code ── */
  process.exit(failed > 0 && totalCritical > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('\n❌ Помилка виконання:', err.message)
  process.exit(1)
})
