import { SITE, STATIC_PAGES } from '@/constants'
import { CACHE_CONTROL } from '@/lib/cache/cache-control-matrix'
import { getPublishedServices, getPublishedBlogCategories } from '@/lib/content'
import { getBlogPostsIndex, getPricingPlans, getServiceSidebar } from '@/lib/db/public'
import { LLMS_FULL_PREFIX, LLMS_FULL_SUFFIX, buildPricingTable } from '@/lib/static/llms'

/**
 * /llms-full.txt as a cached aggregate artifact (AGENTS.md §3.5 + §6, plan
 * FINAL-SEO-COMBINE-ROADMAP-2026-08-25 Phase 5.1).
 *
 * Requirements mirrored from src/lib/sitemap.ts:
 *  1. The FINAL text is cached as a whole — request path = 1 KV get.
 *     Rebuild happens at most once per hour (cron) plus right after
 *     on-demand invalidation (see /api/revalidate).
 *  2. The rebuild uses light getters only (no contentHtml/faqJson lists):
 *     - services  → getServiceSidebar (slug/title/description, own KV key)
 *     - blog      → getBlogPostsIndex (id/slug/title/excerpt/categorySlug)
 *     - categories→ getBlogCategories via getPublishedBlogCategories
 *     - pricing   → getPricingPlans (same source as JSON-LD and /tseny)
 *  3. R2 durable snapshot (no TTL) — served stale if a rebuild ever fails.
 */

export const LLMS_FULL_KEY = 'llms:full:txt'
export const LLMS_FULL_TTL = 3600
export const R2_LLMS_FULL_KEY = 'content/llms-full.txt'
export const LLMS_FULL_CACHE_CONTROL = CACHE_CONTROL.llmsFull

const BASE = SITE.url

function trimSummary(text: string | null | undefined, max = 160): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).replace(/[\s,;:.-]+$/, '') + '…'
}

interface IndexSection {
  title: string
  lines: string[]
}

function sectionBlock(section: IndexSection): string {
  return `\n### ${section.title}\n\n` + (section.lines.length > 0 ? section.lines.join('\n') : '_No published entries._') + '\n'
}

/** URL index built from the same sources as sitemap.xml (light getters). */
export async function buildLlmsFullUrlIndex(): Promise<string> {
  const [ruServices, ukServices, ruPosts, ukPosts, ruCats, ukCats, ruSidebar, ukSidebar] =
    await Promise.all([
      getPublishedServices('ru').catch(() => null),
      getPublishedServices('uk').catch(() => null),
      getBlogPostsIndex('ru').catch(() => [] as Awaited<ReturnType<typeof getBlogPostsIndex>>),
      getBlogPostsIndex('uk').catch(() => [] as Awaited<ReturnType<typeof getBlogPostsIndex>>),
      getPublishedBlogCategories('ru').catch(() => null),
      getPublishedBlogCategories('uk').catch(() => null),
      getServiceSidebar('ru').catch(() => [] as Awaited<ReturnType<typeof getServiceSidebar>>),
      getServiceSidebar('uk').catch(() => [] as Awaited<ReturnType<typeof getServiceSidebar>>),
    ])

  /* Titles: D1 first (id-paired, same as sitemap), fallback to sidebar list
     (slug-paired via RU slug) so the index is never empty when D1 hiccups. */
  const ruServiceBySlug = new Map((ruSidebar ?? []).map((s) => [s.slug, s]))
  const ukServiceBySlug = new Map((ukSidebar ?? []).map((s) => [s.slug, s]))

  const serviceLines: string[] = []
  const services = ruServices ?? []
  for (const ru of services) {
    const uk = (ukServices ?? []).find((s) => s.id === ru.id)
    const ruSlug = ru.translation.slug
    const ukSlug = uk?.translation.slug ?? ruSlug
    const ruTitle = ru.translation.title || ruServiceBySlug.get(ruSlug)?.title || ruSlug
    const ukTitle =
      uk?.translation.title || ukServiceBySlug.get(ukSlug)?.title || ruTitle
    const summary = trimSummary(
      ru.translation.metaDescription || ruServiceBySlug.get(ruSlug)?.description,
    )
    serviceLines.push(
      `- [${ruTitle}](${BASE}/ru/uslugi/${ruSlug}/) / [${ukTitle}](${BASE}/uk/poslugy/${ukSlug}/)` +
        (summary ? ` — ${summary}` : ''),
    )
  }

  const postLines: string[] = []
  for (const ru of ruPosts) {
    const uk = (ukPosts ?? []).find((p) => p.id === ru.id)
    const ukSlug = uk?.slug ?? ru.slug
    const ukTitle = uk?.title ?? ru.title
    const summary = trimSummary(ru.excerpt)
    postLines.push(
      `- [${ru.title}](${BASE}/ru/blog/${ru.slug}/) / [${ukTitle}](${BASE}/uk/blog/${ukSlug}/)` +
        (summary ? ` — ${summary}` : ''),
    )
  }

  const categoryLines: string[] = []
  for (const ru of ruCats ?? []) {
    const uk = (ukCats ?? []).find((c) => c.id === ru.id)
    const ukSlug = uk?.translation.slug ?? ru.translation.slug
    categoryLines.push(
      `- Category: ${BASE}/ru/blog/kategoriya/${ru.translation.slug}/ / ${BASE}/uk/blog/kategoriya/${ukSlug}/`,
    )
  }

  const staticLines: string[] = []
  for (const page of STATIC_PAGES) {
    const slug = page.slug.replace(/\/$/, '')
    const ukSlug =
      slug === 'tseny' ? 'tsiny' : slug === 'ob-avtore' ? 'pro-avtora' : slug === 'uslugi' ? 'poslugy' : slug
    staticLines.push(`- ${BASE}/ru/${slug}/ / ${BASE}/uk/${ukSlug}/`)
  }

  const sections: IndexSection[] = [
    { title: 'Static Pages', lines: staticLines },
    { title: `Services (${serviceLines.length})`, lines: serviceLines },
    { title: `Blog Categories (${categoryLines.length})`, lines: categoryLines },
    { title: `Blog Posts (${postLines.length})`, lines: postLines },
  ]

  return (
    '\n## Page Index (auto-generated, mirrors sitemap.xml)\n' +
    sections.map(sectionBlock).join('')
  )
}

export interface LlmsFullCacheEnv {
  CONTENT_CACHE_KV?: KVNamespace
  CONTENT_CACHE_R2?: R2Bucket
}

export interface LlmsFullResult {
  text: string
  /** true when served from the R2 durable snapshot after a rebuild failure. */
  stale: boolean
}

async function rebuild(): Promise<string> {
  const plans = await getPricingPlans('ru').catch(() => null)
  return (
    LLMS_FULL_PREFIX +
    buildPricingTable(plans) +
    (await buildLlmsFullUrlIndex()) +
    LLMS_FULL_SUFFIX
  )
}

/**
 * Served text for /llms-full.txt: KV hit → return; miss → rebuild + repopulate
 * (KV put + R2 mirror via waitUntil); rebuild failure → R2 snapshot.
 */
export async function getLlmsFull(
  env: LlmsFullCacheEnv,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<LlmsFullResult> {
  if (env.CONTENT_CACHE_KV) {
    try {
      const cached = await env.CONTENT_CACHE_KV.get(LLMS_FULL_KEY, { type: 'text' })
      if (cached !== null) return { text: cached, stale: false }
    } catch {
      // KV error — fall through to rebuild
    }
  }

  try {
    const text = await rebuild()
    const puts: Promise<unknown>[] = []
    if (env.CONTENT_CACHE_KV) {
      puts.push(env.CONTENT_CACHE_KV.put(LLMS_FULL_KEY, text, { expirationTtl: LLMS_FULL_TTL }))
    }
    if (env.CONTENT_CACHE_R2) {
      puts.push(
        env.CONTENT_CACHE_R2.put(R2_LLMS_FULL_KEY, text, {
          httpMetadata: { contentType: 'text/plain; charset=utf-8' },
        }),
      )
    }
    if (waitUntil) waitUntil(Promise.allSettled(puts))
    else await Promise.allSettled(puts)
    return { text, stale: false }
  } catch (buildError) {
    if (env.CONTENT_CACHE_R2) {
      try {
        const snapshot = await env.CONTENT_CACHE_R2.get(R2_LLMS_FULL_KEY)
        if (snapshot) return { text: await new Response(snapshot.body).text(), stale: true }
      } catch {
        // R2 also failed — surface the original error
      }
    }
    throw buildError
  }
}

/** Targeted invalidation (AGENTS.md §4) — called from /api/revalidate. */
export async function invalidateLlmsFull(env: LlmsFullCacheEnv): Promise<void> {
  await Promise.allSettled([
    env.CONTENT_CACHE_KV ? env.CONTENT_CACHE_KV.delete(LLMS_FULL_KEY) : Promise.resolve(),
    env.CONTENT_CACHE_R2 ? env.CONTENT_CACHE_R2.delete(R2_LLMS_FULL_KEY) : Promise.resolve(),
  ])
}

/** Warm-up after invalidation (and on cron) — first request is a KV hit. */
export async function warmLlmsFull(env: LlmsFullCacheEnv): Promise<void> {
  const text = await rebuild()
  await Promise.allSettled([
    env.CONTENT_CACHE_KV ? env.CONTENT_CACHE_KV.put(LLMS_FULL_KEY, text, { expirationTtl: LLMS_FULL_TTL }) : Promise.resolve(),
    env.CONTENT_CACHE_R2
      ? env.CONTENT_CACHE_R2.put(R2_LLMS_FULL_KEY, text, {
          httpMetadata: { contentType: 'text/plain; charset=utf-8' },
        })
      : Promise.resolve(),
  ])
}
