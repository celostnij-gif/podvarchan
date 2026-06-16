#!/usr/bin/env node

/**
 * Экспорт статической версии сайта в папку SITEPOD/
 *
 * Подход: next build (нормальная сборка) → next start (сервер) →
 *         краулинг всех страниц через fetch → сохранение в SITEPOD/
 *
 * Запуск: node scripts/export-static.mjs
 */

import { copyFileSync, existsSync, mkdirSync, rmSync, readdirSync, statSync, writeFileSync } from 'fs'
import { execSync, spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

/* ── Пути ── */

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SITEPOD = join(ROOT, 'SITEPOD')
const PORT = 3789

function log(msg) {
  console.log(`  ${msg}`)
}

function ok(msg) {
  console.log(`  ✅ ${msg}`)
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`)
}

/* ── Список URL для краулинга ── */

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
]

const BLOG_CATEGORY_SLUGS = [
  'trevoga',
  'gipnoterapiya',
  'samosabotazh',
  'podsoznanie',
  'psikhosomatika',
  'neyverennost',
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

/** Собирает полный список относительных URL с ведущим / */
function getAllUrls() {
  const urls = ['/']

  for (const locale of LOCALES) {
    // статические страницы
    for (const path of STATIC_PATHS) {
      urls.push(`/${locale}/${path}`)
    }

    // услуги
    for (const slug of SERVICE_SLUGS) {
      urls.push(`/${locale}/uslugi/${slug}/`)
    }

    // категории блога
    for (const slug of BLOG_CATEGORY_SLUGS) {
      urls.push(`/${locale}/blog/kategoriya/${slug}/`)
    }

    // статьи блога
    for (const slug of BLOG_POST_SLUGS) {
      urls.push(`/${locale}/blog/${slug}/`)
    }
  }

  return urls
}

const URLS = getAllUrls()

/* ── Защита от прерывания ── */

let serverProcess = null
let cleanupDone = false

async function cleanup() {
  if (cleanupDone) return
  cleanupDone = true

  if (serverProcess) {
    serverProcess.kill('SIGTERM')
    log('Сервер остановлен')
    serverProcess = null
  }
}

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Прерывание. Останавливаю сервер...')
  await cleanup()
  process.exit(130)
})

process.on('SIGTERM', async () => {
  await cleanup()
  process.exit(143)
})

/* ── Пауза ── */

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/* ── Загрузка страницы ── */

async function fetchPage(url) {
  const fullUrl = `http://localhost:${PORT}${url}`
  const resp = await fetch(fullUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${fullUrl}`)
  }
  return {
    html: await resp.text(),
    status: resp.status,
  }
}

/* ── Сохранение страницы ── */

function savePage(urlPath, html) {
  // /ru/uslugi/ → SITEPOD/ru/uslugi/index.html
  // /        → SITEPOD/index.html
  const relative = urlPath === '/'
    ? 'index.html'
    : urlPath.endsWith('/')
      ? `${urlPath}index.html`
      : urlPath.endsWith('.html')
        ? urlPath
        : `${urlPath}.html`

  const filePath = join(SITEPOD, relative)
  const dir = dirname(filePath)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(filePath, html, 'utf-8')
}

/* ── Извлечение asset-ов из HTML ── */

function extractAssetUrls(html, baseUrl) {
  const assets = new Set()

  // CSS from <link>
  const cssRe = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi
  let m
  while ((m = cssRe.exec(html)) !== null) {
    assets.add(m[1])
  }

  // JS from <script src>
  const jsRe = /<script[^>]*src=["']([^"']+)["']/gi
  while ((m = jsRe.exec(html)) !== null) {
    assets.add(m[1])
  }

  // preload/prefetch
  const preloadRe = /<link[^>]*rel=["'](?:preload|prefetch)["'][^>]*href=["']([^"']+)["']/gi
  while ((m = preloadRe.exec(html)) !== null) {
    assets.add(m[1])
  }

  // icons (favicon, apple-touch-icon, mask-icon, manifest)
  const iconRe = /<link[^>]*rel=["'](?:icon|apple-touch-icon|mask-icon|manifest)["'][^>]*href=["']([^"']+)["']/gi
  while ((m = iconRe.exec(html)) !== null) {
    assets.add(m[1])
  }

  // images from <img>
  const imgRe = /<img[^>]*src=["']([^"']+)["']/gi
  while ((m = imgRe.exec(html)) !== null) {
    assets.add(m[1])
  }

  // <source srcset/href
  const sourceRe = /<(?:source|video|audio)[^>]*src(?:set)?=["']([^"']+)["']/gi
  while ((m = sourceRe.exec(html)) !== null) {
    assets.add(m[1])
  }

  // JSON-LD with image URLs
  const jsonLdRe = /<script[^>]*type=["']application\/ld\+json["']>([^<]+)<\/script>/gi
  while ((m = jsonLdRe.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim())
      const urls = extractJsonLdImageUrls(parsed)
      for (const u of urls) assets.add(u)
    } catch {
      // ignore
    }
  }

  // Filter: only absolute paths starting with /
  const result = new Set()
  for (const asset of assets) {
    if (asset.startsWith('/')) {
      // Normalize: remove query strings for path resolution but use original for fetch
      result.add(asset)
    }
  }

  return [...result]
}

function extractJsonLdImageUrls(obj) {
  const urls = []
  if (!obj || typeof obj !== 'object') return urls

  if (Array.isArray(obj)) {
    for (const item of obj) {
      urls.push(...extractJsonLdImageUrls(item))
    }
  } else {
    for (const key of ['image', 'thumbnailUrl', 'url']) {
      if (typeof obj[key] === 'string' && obj[key].startsWith('/')) {
        urls.push(obj[key])
      }
    }
    for (const val of Object.values(obj)) {
      urls.push(...extractJsonLdImageUrls(val))
    }
  }

  return urls
}

/* ── Фикс _next/image URLs ── */
/* Заменяет /_next/image?url=...&w=...&q=... на оригинальные пути */

function fixImageUrls(html) {
  return html.replace(/\/_next\/image\?url=([^"'&]+)(?:&[^"'\s]*)?/g, (match, urlParam) => {
    return decodeURIComponent(urlParam)
  })
}

/* ── Загрузка и сохранение asset-ов ── */

async function downloadAsset(urlPath) {
  const fullUrl = `http://localhost:${PORT}${urlPath}`
  let resp
  try {
    resp = await fetch(fullUrl, {
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    return null
  }

  if (!resp.ok) return null

  const buffer = await resp.arrayBuffer()
  return Buffer.from(buffer)
}

function saveAsset(urlPath, buffer) {
  // /_next/static/css/abc.css → SITEPOD/_next/static/css/abc.css
  // Remove leading slash for join() on Windows
  const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath
  const filePath = join(SITEPOD, relativePath)
  const dir = dirname(filePath)

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(filePath, buffer)
}

/* ── Main ── */

async function main() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  ЭКСПОРТ СТАТИЧЕСКОЙ ВЕРСИИ САЙТА В SITEPOD/')
  console.log('══════════════════════════════════════════════\n')

  /* ── Шаг 1. Сборка ── */
  console.log('📦 Шаг 1. Сборка проекта (next build)...')
  try {
    execSync('npx next build', {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 600000,
    })
    ok('Сборка завершена')
  } catch (err) {
    console.error('\n❌ Ошибка сборки!')
    process.exit(1)
  }

  /* ── Шаг 2. Запуск сервера ── */
  console.log('\n🚀 Шаг 2. Запуск сервера (next start)...')

  serverProcess = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' },
  })

  serverProcess.stdout.on('data', (data) => {
    const text = data.toString()
    process.stdout.write(`  [server] ${text}`)
  })

  serverProcess.stderr.on('data', (data) => {
    const text = data.toString()
    // Next.js пишет в stderr информационные сообщения
    if (!text.includes('Ready') && !text.includes('started')) {
      process.stderr.write(`  [server] ${text}`)
    }
  })

  serverProcess.on('exit', (code) => {
    if (!cleanupDone) {
      console.error(`\n  ❌ Сервер неожиданно завершился с кодом ${code}`)
      process.exit(1)
    }
  })

  /* ── Ждём готовности сервера ── */
  console.log('  Ожидание готовности сервера...')
  let serverReady = false
  for (let i = 0; i < 60; i++) {
    try {
      const resp = await fetch(`http://localhost:${PORT}/`, {
        signal: AbortSignal.timeout(2000),
      })
      if (resp.ok) {
        serverReady = true
        break
      }
    } catch {
      // ещё не готов
    }
    await sleep(2000)
  }

  if (!serverReady) {
    console.error('\n❌ Сервер не запустился за 120 секунд')
    await cleanup()
    process.exit(1)
  }

  ok('Сервер запущен')

  /* ── Шаг 3. Краулинг HTML страниц ── */
  console.log(`\n🌐 Шаг 3. Краулинг ${URLS.length} страниц...`)

  // Удаляем старую SITEPOD/
  if (existsSync(SITEPOD)) {
    rmSync(SITEPOD, { recursive: true, force: true })
  }

  const allAssets = new Set()
  let successCount = 0
  let failCount = 0
  let total = URLS.length

  for (let i = 0; i < URLS.length; i++) {
    const url = URLS[i]
    process.stdout.write(`  [${i + 1}/${total}] ${url}`)
    try {
      let { html } = await fetchPage(url)

      // Post-process: fix _next/image URLs
      html = fixImageUrls(html)

      savePage(url, html)

      // Собираем asset-ы из HTML (после фикса изображений)
      const pageAssets = extractAssetUrls(html, url)
      for (const asset of pageAssets) {
        allAssets.add(asset)
      }

      process.stdout.write(' ✅\n')
      successCount++
    } catch (err) {
      process.stdout.write(` ❌ ${err.message}\n`)
      failCount++
    }
  }

  console.log(`\n  Результат: ${successCount} успешно, ${failCount} ошибок`)

  /* ── Шаг 4. Загрузка asset-ов ── */
  console.log(`\n🎨 Шаг 4. Загрузка ${allAssets.size} asset-ов...`)

  let assetOk = 0
  let assetFail = 0
  let i = 0

  for (const asset of allAssets) {
    i++
    process.stdout.write(`  [${i}/${allAssets.size}] ${asset.substring(0, 60)}...`)
    const buffer = await downloadAsset(asset)
    if (buffer) {
      saveAsset(asset, buffer)
      process.stdout.write(' ✅\n')
      assetOk++
    } else {
      process.stdout.write(' ⚠️  не найден\n')
      assetFail++
    }
  }

  console.log(`\n  Asset-ы: ${assetOk} загружено, ${assetFail} пропущено`)

  /* ── Шаг 5. Создание index.html с редиректом ── */
  console.log('\n📝 Шаг 5. Создание index.html с редиректом на /ru/...')

  const redirectHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0; url=/ru/">
  <title>Podvarchan.com — гипнотерапия онлайн</title>
  <link rel="canonical" href="https://podvarchan.com/ru/">
</head>
<body>
  <script>window.location.replace('/ru/');</script>
  <p>Переход на <a href="/ru/">главную страницу</a>...</p>
</body>
</html>`

  writeFileSync(join(SITEPOD, 'index.html'), redirectHtml, 'utf-8')
  ok('index.html создан')

  /* ── Шаг 6. Удаляем .html расширения для .js/.css/.json (next.js статика) ── */
  // Ничего не делаем — всё уже сохранено с правильными путями

  /* ── Шаг 7. Считаем результат ── */
  const items = countFiles(SITEPOD)
  console.log(`\n📊 Результат:`)
  console.log(`  Страниц:    ${successCount}`)
  console.log(`  Asset-ов:   ${assetOk}`)
  console.log(`  Папок:      ${items.dirs}`)
  console.log(`  Файлов:     ${items.files}`)

  /* ── Остановка сервера ── */
  console.log('\n🛑 Шаг 6. Остановка сервера...')
  await cleanup()

  console.log('\n══════════════════════════════════════════════')
  console.log('  ✅ СТАТИЧЕСКАЯ ВЕРСИЯ ГОТОВА!')
  console.log(`  📁 SITEPOD/ — ${items.files} файлов`)
  console.log('══════════════════════════════════════════════\n')
}

function countFiles(dir) {
  let dirs = 0
  let files = 0

  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory()) {
          dirs++
          const sub = countFiles(fullPath)
          dirs += sub.dirs
          files += sub.files
        } else {
          files++
        }
      } catch {
        continue
      }
    }
  } catch {
    // ignore
  }

  return { dirs, files }
}

/* ── Запуск ── */

main().catch(async (err) => {
  console.error('\n❌ Ошибка:', err.message)
  await cleanup()
  process.exit(1)
})
