/**
 * Post-seeding revalidation — hits the public site's /api/revalidate/ endpoint
 * to invalidate cached pages after D1 seeding.
 *
 * Requires: REVALIDATE_SECRET env var (same as in admin worker).
 * Run: REVALIDATE_SECRET=xxx node scripts/seo-revalidate.mjs
 * Or:  node scripts/seo-revalidate.mjs  (uses .env.local)
 */
import { readFileSync } from 'fs'

// Load env from wrangler or .env.local
let secret = process.env.REVALIDATE_SECRET
if (!secret) {
  for (const f of ['.env.local', '.env']) {
    try {
      const env = readFileSync(f, 'utf8')
      const match = env.match(/REVALIDATE_SECRET=(.+)/)
      if (match) { secret = match[1].trim().replace(/^["']|["']$/g, ''); break }
    } catch {}
  }
}
if (!secret) {
  console.error('REVALIDATE_SECRET not set. Pass it or add to .env.local')
  process.exit(1)
}

const base = (process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com').replace(/\/$/, '')

// All paths that need revalidation after content seeding
const paths = [
  // New service pages
  '/ru/uslugi/psiholog-dlya-emigrantov/',
  '/uk/uslugi/psikholog-dlya-emigrantiv/',
  '/ru/uslugi/psiholog-onlajn-germaniya/',
  '/uk/uslugi/psikholog-onlajn-germaniya/',
  '/ru/uslugi/psiholog-onlajn-avstriya/',
  '/uk/uslugi/psikholog-onlajn-avstriya/',
  '/ru/uslugi/psiholog-onlajn-polsha/',
  '/uk/uslugi/psikholog-onlajn-polsha/',
  // Rewritten service pages
  '/ru/uslugi/trevoga-i-panicheskiye-ataki/',
  '/ru/uslugi/psikhosomatika/',
  '/ru/uslugi/rabota-s-podsoznaniem/',
  '/ru/uslugi/samosabotazh-i-bloki/',
  '/ru/uslugi/utrennyaya-trevoga/',
  '/ru/uslugi/trevoga-posle-stressa/',
  // New blog posts
  '/ru/blog/emigraciya/nostalgiya-po-rodine/',
  '/ru/blog/emigraciya/kulturnyy-shok/',
  '/ru/blog/emigraciya/trevoga-posle-pereezda/',
  '/ru/blog/emigraciya/odinochestvo-v-emigracii/',
  '/ru/blog/trevoga/kak-ostanovit-panicheskuyu-ataku/',
  '/ru/blog/trevoga/postoyannaya-trevoga-bez-prichiny/',
  '/ru/blog/gipnoterapiya/chto-takoe-eriksonovskiy-gipnoz/',
  '/ru/blog/gipnoterapiya/effektivna-li-gipnoterapiya-onlajn/',
  // List pages + sitemaps
  '/ru/uslugi/',
  '/uk/uslugi/',
  '/ru/blog/',
  '/uk/blog/',
  '/ru/sitemap.xml',
  '/uk/sitemap.xml',
]

async function revalidate() {
  console.log(`Revalidating ${paths.length} paths via ${base}/api/revalidate/ ...`)

  const res = await fetch(`${base}/api/revalidate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, paths, type: 'page' }),
  })

  if (res.ok) {
    const body = await res.json().catch(() => ({}))
    console.log(`✓ Revalidated ${paths.length} paths`, body.revalidated ? `(${body.revalidated} confirmed)` : '')
  } else {
    const text = await res.text().catch(() => '')
    console.error(`✗ Failed ${res.status}: ${text}`)
    process.exit(1)
  }
}

revalidate()
