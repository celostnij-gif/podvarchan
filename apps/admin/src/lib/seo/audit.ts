import { STATIC_PAGES } from '@/constants'
import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { blogPosts, blogPostTranslations, blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { eq } from 'drizzle-orm'

/* ── Types ── */

export interface SeoUrlRow {
  url: string
  locale: 'ru' | 'uk'
  entityType: string
  entityId: string
  title: string | null
  description: string | null
  h1: string | null
  hasContent: boolean
  wordCount: number
  score: number
  warnings: string[]
}

export interface AuditSummary {
  total: number
  avgScore: number
  green: number
  yellow: number
  red: number
}

/* ── Scoring thresholds ── */

const SCORE_TITLE_LENGTH = 15
const SCORE_DESC_LENGTH = 15
const SCORE_H1 = 10
const SCORE_CONTENT = 10

function scoreTitle(title: string | null): { points: number; warning: string | null } {
  if (!title) return { points: 0, warning: 'Відсутній <title>' }
  const len = title.length
  if (len < 10) return { points: 0, warning: `Заголовок занадто короткий (${len} символів)` }
  if (len < 30) return { points: 5, warning: `Заголовок короткий (${len} символів, оптимально 30-60)` }
  if (len <= 60) return { points: SCORE_TITLE_LENGTH, warning: null }
  if (len <= 80) return { points: 5, warning: `Заголовок довгий (${len} символів, оптимально 30-60)` }
  return { points: 0, warning: `Заголовок занадто довгий (${len} символів, максимум 60)` }
}

function scoreDescription(desc: string | null): { points: number; warning: string | null } {
  if (!desc) return { points: 0, warning: 'Відсутній meta description' }
  const len = desc.length
  if (len < 50) return { points: 0, warning: `Опис занадто короткий (${len} символів)` }
  if (len < 70) return { points: 5, warning: `Опис короткий (${len} символів, оптимально 70-160)` }
  if (len <= 160) return { points: SCORE_DESC_LENGTH, warning: null }
  if (len <= 200) return { points: 5, warning: `Опис довгий (${len} символів, оптимально 70-160)` }
  return { points: 0, warning: `Опис занадто довгий (${len} символів, максимум 160)` }
}

function scoreH1(h1: string | null): { points: number; warning: string | null } {
  if (!h1) return { points: 0, warning: 'Відсутній заголовок H1' }
  if (h1.length < 10) return { points: 3, warning: 'H1 занадто короткий' }
  return { points: SCORE_H1, warning: null }
}

function scoreContent(wordCount: number): { points: number; warning: string | null } {
  if (wordCount === 0) return { points: 0, warning: 'Немає тіла контенту' }
  if (wordCount < 100) return { points: 2, warning: `Тонкий контент (~${wordCount} слів)` }
  if (wordCount < 300) return { points: 5, warning: `Короткий контент (~${wordCount} слів, прагніть до 300+)` }
  return { points: SCORE_CONTENT, warning: null }
}

/* ── Audit collection ── */

async function collectStaticPages(): Promise<SeoUrlRow[]> {
  const rows: SeoUrlRow[] = []
  for (const page of STATIC_PAGES) {
    for (const locale of ['ru', 'uk'] as const) {
      const url = `/${locale}/${page.slug}`
      rows.push({
        url,
        locale,
        entityType: 'static_page',
        entityId: page.slug.replace(/\//g, '_') || 'home',
        title: null,
        description: null,
        h1: null,
        hasContent: false,
        wordCount: 0,
        score: 0,
        warnings: ['Статична сторінка — читайте метадані з messages/*.json'],
      })
    }
  }
  return rows
}

async function collectServices(): Promise<SeoUrlRow[]> {
  const db = getDB()
  const all = await db
    .select()
    .from(services)
    .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
    .where(eq(services.status, 'PUBLISHED'))
    .all()

  const rows: SeoUrlRow[] = []
  for (const row of all) {
    const trans = row.service_translations
    if (!trans) continue
    const url = `/${trans.locale}/uslugi/${trans.slug}`
    const title = trans.title ?? null
    const description = trans.description ?? null
    // hero fields often serve as H1
    const h1 = trans.heroTitle ?? trans.title ?? null
    const contentLen = (trans.description ?? '').length + (trans.symptomsJson ?? '').length + (trans.processJson ?? '').length
    const wordCount = Math.round(contentLen / 6)

    const titleScore = scoreTitle(title)
    const descScore = scoreDescription(description)
    const h1Score = scoreH1(h1)
    const contentScore = scoreContent(wordCount)
    const total = titleScore.points + descScore.points + h1Score.points + contentScore.points

    const warnings = [titleScore.warning, descScore.warning, h1Score.warning, contentScore.warning].filter(Boolean) as string[]

    rows.push({
      url,
      locale: trans.locale,
      entityType: 'service',
      entityId: row.services.id,
      title,
      description,
      h1,
      hasContent: wordCount > 0,
      wordCount,
      score: total,
      warnings,
    })
  }
  return rows
}

async function collectBlogPosts(): Promise<SeoUrlRow[]> {
  const db = getDB()
  const all = await db
    .select()
    .from(blogPosts)
    .leftJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
    .where(eq(blogPosts.status, 'PUBLISHED'))
    .all()

  const rows: SeoUrlRow[] = []
  for (const row of all) {
    const trans = row.blog_post_translations
    if (!trans) continue
    const url = `/${trans.locale}/blog/${trans.slug}`
    const title = trans.title ?? null
    // excerpt often serves as meta description
    const description = trans.excerpt ?? null
    const h1 = trans.title ?? null
    const contentLen = (trans.contentHtml ?? '').length
    const wordCount = Math.round(contentLen / 6)

    const titleScore = scoreTitle(title)
    const descScore = scoreDescription(description)
    const h1Score = scoreH1(h1)
    const contentScore = scoreContent(wordCount)
    const total = titleScore.points + descScore.points + h1Score.points + contentScore.points

    const warnings = [titleScore.warning, descScore.warning, h1Score.warning, contentScore.warning].filter(Boolean) as string[]

    rows.push({
      url,
      locale: trans.locale,
      entityType: 'blog_post',
      entityId: row.blog_posts.id,
      title,
      description,
      h1,
      hasContent: wordCount > 0,
      wordCount,
      score: total,
      warnings,
    })
  }
  return rows
}

async function collectBlogCategories(): Promise<SeoUrlRow[]> {
  const db = getDB()
  const all = await db
    .select()
    .from(blogCategories)
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .where(eq(blogCategories.status, 'PUBLISHED'))
    .all()

  const rows: SeoUrlRow[] = []
  for (const row of all) {
    const trans = row.blog_category_translations
    if (!trans) continue
    const url = `/${trans.locale}/blog/kategoriya/${trans.slug}`
    const title = trans.name ?? null
    const description = trans.description ?? null
    const h1 = trans.name ?? null
    // category pages typically have no content body besides list
    const wordCount = 0

    const titleScore = scoreTitle(title)
    const descScore = scoreDescription(description)
    const h1Score = scoreH1(h1)
    const contentScore = scoreContent(wordCount)
    const total = titleScore.points + descScore.points + h1Score.points + contentScore.points

    const warnings = [titleScore.warning, descScore.warning, h1Score.warning, contentScore.warning].filter(Boolean) as string[]

    rows.push({
      url,
      locale: trans.locale,
      entityType: 'blog_category',
      entityId: row.blog_categories.id,
      title,
      description,
      h1,
      hasContent: false,
      wordCount,
      score: total,
      warnings,
    })
  }
  return rows
}

/* ── Public API ── */

export async function runSeoAudit(): Promise<SeoUrlRow[]> {
  const results: SeoUrlRow[] = []

  // Collect from all sources in parallel
  const [staticPages, svc, posts, cats] = await Promise.all([
    collectStaticPages(),
    collectServices(),
    collectBlogPosts(),
    collectBlogCategories(),
  ])

  results.push(...staticPages, ...svc, ...posts, ...cats)

  // Sort by score ascending (worst first)
  results.sort((a, b) => a.score - b.score)

  return results
}

export function computeAuditSummary(rows: SeoUrlRow[]): AuditSummary {
  const total = rows.length
  if (total === 0) return { total: 0, avgScore: 0, green: 0, yellow: 0, red: 0 }

  const sum = rows.reduce((s, r) => s + r.score, 0)
  const green = rows.filter((r) => r.score >= 40).length
  const yellow = rows.filter((r) => r.score >= 20 && r.score < 40).length
  const red = rows.filter((r) => r.score < 20).length

  return {
    total,
    avgScore: Math.round(sum / total),
    green,
    yellow,
    red,
  }
}

export function scoreColorClass(score: number): string {
  if (score >= 40) return 'text-green-400 bg-green-900/30 border border-green-700/30'
  if (score >= 20) return 'text-yellow-400 bg-yellow-900/30 border border-yellow-700/30'
  return 'text-red-400 bg-red-900/30 border border-red-700/30'
}

export function scoreLabel(score: number): string {
  if (score >= 40) return 'Добре'
  if (score >= 20) return 'Потребує роботи'
  return 'Погано'
}

/** Build a fake Google search result snippet preview. */
export function googleSnippetPreview(title: string | null, description: string | null, url: string): string {
  const siteName = 'Podvarchan.com › '
  const displayUrl = `${siteName}${url.replace(/^\/(ru|uk)\//, '').replace(/\/$/, '')}`
  const snippetTitle = title ?? 'Без заголовка'
  const snippetDesc = description ?? 'Без опису'
  return `[ ${snippetTitle} ]
${displayUrl}
${snippetDesc.length > 160 ? snippetDesc.slice(0, 157) + '...' : snippetDesc}`
}
