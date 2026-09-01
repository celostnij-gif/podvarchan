import { STATIC_PAGES } from '@/constants'
import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { blogPosts, blogPostTranslations, blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { pages, pageTranslations } from '@/db/schema/pages'
import { seoMeta } from '@podvarchan/shared'
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

/* ── Rendered-metadata sources ──
 * The audit mirrors what the public site actually renders:
 *   static pages → seo_meta override ?? i18n messages (generateMetadata contract);
 *   services/posts/categories → seo_meta override ?? translations.
 * MESSAGES_FALLBACK must be kept in sync with messages/ru.json, messages/uk.json.
 */

type MetaTriple = { title: string | null; description: string | null; h1: string | null }

const MESSAGES_FALLBACK: Record<string, MetaTriple> = {
  'home|ru': {
    title: 'Психолог по тревоге и паническим атакам онлайн',
    description: 'Эриксоновский гипноз при тревоге и панических атаках — мягко и с проработкой первопричины. Онлайн. Первая консультация — бесплатно.',
    h1: null,
  },
  'home|uk': {
    title: 'Психолог при тривозі та панічних атаках онлайн',
    description: 'Еріксонівський гіпноз при тривозі та панічних атаках — м\'яко і з опрацюванням першопричини. Онлайн. Перша консультація — безкоштовно.',
    h1: null,
  },
  'ob-avtore|ru': {
    title: 'Гипнотерапевт онлайн',
    description: 'Сертифицированный гипнотерапевт онлайн, основатель школы «Пробудология». Работа с тревогой, паническими атаками, подсознанием, самосаботажем и психосоматикой. Эриксоновский и регрессивный гипноз.',
    h1: null,
  },
  'ob-avtore|uk': {
    title: 'Гіпнотерапевт онлайн',
    description: 'Сертифікований гіпнотерапевт онлайн, засновник школи «Пробудологія». Робота з тривогою, панічними атаками, підсвідомістю, самосаботажем і психосоматикою. Еріксонівський та регресивний гіпноз.',
    h1: null,
  },
  'metod|ru': {
    title: 'Авторский метод: эриксоновский гипноз и пробудология',
    description: 'Авторский метод гипнотерапии, опирающийся на философию «Пробудология»: эриксоновский гипноз, регрессивные техники и интеграция КПТ. Мягкая и глубокая работа с подсознанием онлайн.',
    h1: 'Авторский метод',
  },
  'metod|uk': {
    title: 'Авторський метод: еріксонівський гіпноз і пробудологія',
    description: 'Авторський метод гіпнотерапії, що спирається на філософію «Пробудологія»: еріксонівський гіпноз, регресивні техніки та інтеграція КПТ. М\'яка та глибока робота з підсвідомістю онлайн.',
    h1: 'Авторський метод',
  },
  'faq|ru': {
    title: 'FAQ — вопросы и ответы о гипнотерапии',
    description: 'Ответы на частые вопросы о гипнотерапии онлайн: безопасность, количество сессий, методы, противопоказания.',
    h1: 'Часто задаваемые вопросы',
  },
  'faq|uk': {
    title: 'FAQ — питання та відповіді про гіпнотерапію',
    description: 'Відповіді на часті питання про гіпнотерапію онлайн: безпека, кількість сесій, методи, протипоказання.',
    h1: 'Часті запитання',
  },
  'kontakty|ru': {
    title: 'Контакты — запись на консультацию онлайн',
    description: 'Запись на сессию гипнотерапии онлайн. Бесплатная 15-минутная диагностическая консультация. Свяжитесь через Telegram, WhatsApp или email для записи.',
    h1: 'Контакты',
  },
  'kontakty|uk': {
    title: 'Контакти — запис на консультацію онлайн',
    description: 'Запис на сесію гіпнотерапії онлайн. Безкоштовна 15-хвилинна діагностична консультація. Зв\'яжіться через Telegram, WhatsApp або email для запису.',
    h1: 'Контакти',
  },
  'politika-konfidentsialnosti|ru': {
    title: 'Политика конфиденциальности',
    description: 'Политика конфиденциальности и обработки персональных данных сайта podvarchan.com.',
    h1: 'Политика конфиденциальности',
  },
  'politika-konfidentsialnosti|uk': {
    title: 'Політика конфіденційності',
    description: 'Політика конфіденційності та обробки персональних даних сайту podvarchan.com.',
    h1: 'Політика конфіденційності',
  },
  'disclaimer|ru': {
    title: 'Дисклеймер',
    description: 'Юридическое уведомление: гипнотерапия онлайн — немедицинский метод психологической помощи. Важная информация для клиентов.',
    h1: 'Дисклеймер',
  },
  'disclaimer|uk': {
    title: 'Дисклеймер',
    description: 'Юридичне повідомлення: гіпнотерапія онлайн — немедичний метод психологічної допомоги. Важлива інформація для клієнтів.',
    h1: 'Дисклеймер',
  },
  'tseny|ru': {
    title: 'Стоимость гипнотерапии онлайн — цены на сессии',
    description: 'Стоимость сессий гипнотерапии онлайн от 50$. Диагностическая консультация бесплатно. Узнайте цену на индивидуальный курс работы с тревогой, самосаботажем и психосоматикой.',
    h1: 'Стоимость гипнотерапии онлайн',
  },
  'tseny|uk': {
    title: 'Вартість гіпнотерапії онлайн — ціни на сесії',
    description: 'Вартість сесій гіпнотерапії онлайн від 50$. Діагностична консультація безкоштовно. Дізнайтеся ціну на індивідуальний курс роботи з тривогою, самосаботажем і психосоматикою.',
    h1: 'Вартість гіпнотерапії онлайн',
  },
  'uslugi|ru': {
    title: 'Психолог онлайн: тревога, паника, гипноз — услуги',
    description: 'Все направления гипнотерапии онлайн: работа с тревогой, подсознанием, самосаботажем, выгоранием и психосоматикой. Мягкий эриксоновский гипноз от сертифицированного специалиста.',
    h1: 'Услуги',
  },
  'uslugi|uk': {
    title: 'Психолог онлайн: тривога, паніка, гіпноз — послуги',
    description: 'Всі напрямки гіпнотерапії онлайн: робота з тривогою, підсвідомістю, самосаботажем, вигоранням та психосоматикою. М\'який еріксонівський гіпноз від сертифікованого спеціаліста.',
    h1: 'Послуги',
  },
  'blog|ru': {
    title: 'Блог о психологии и гипнотерапии — тревога и паника',
    description: 'Статьи о психологии, гипнотерапии, биоэнергетике и подсознании. Практические материалы о тревоге, психосоматике, панических атаках и самосаботаже.',
    h1: 'Блог о психологии, гипнотерапии, биоэнергетике, подсознании и внутренней трансформации',
  },
  'blog|uk': {
    title: 'Блог про психологію та гіпнотерапію — тривога і паніка',
    description: 'Статті про психологію, гіпнотерапію, біоенергетику та підсвідомість. Практичні матеріали про тривогу, психосоматику, панічні атаки та самосаботаж.',
    h1: 'Блог про психологію, гіпнотерапію, біоенергетику, підсвідомість і внутрішню трансформацію',
  },
}

// STATIC_PAGES slug → pages.type ('uslugi/', 'blog/' are i18n index pages — no D1 row).
const STATIC_PAGE_TYPE: Record<string, string> = {
  '': 'HOME',
  'ob-avtore/': 'ABOUT',
  'metod/': 'METHOD',
  'faq/': 'FAQ',
  'kontakty/': 'CONTACTS',
  'politika-konfidentsialnosti/': 'PRIVACY',
  'disclaimer/': 'DISCLAIMER',
  'tseny/': 'PRICING',
}

/* ── seo_meta overrides (what the SEO editor saves) ── */

interface SeoOverride {
  title: string | null
  description: string | null
}

async function loadSeoOverrides(): Promise<Map<string, SeoOverride>> {
  const db = getDB()
  const rows = await db
    .select({
      entityType: seoMeta.entityType,
      entityId: seoMeta.entityId,
      locale: seoMeta.locale,
      title: seoMeta.title,
      description: seoMeta.description,
      updatedAt: seoMeta.updatedAt,
    })
    .from(seoMeta)
    .all()
  const map = new Map<string, SeoOverride & { updatedAt: string }>()
  for (const r of rows) {
    const key = `${r.entityType}|${r.entityId}|${r.locale}`
    const prev = map.get(key)
    if (!prev || (r.updatedAt ?? '') >= prev.updatedAt) {
      map.set(key, { title: r.title, description: r.description, updatedAt: r.updatedAt ?? '' })
    }
  }
  return new Map([...map].map(([k, v]) => [k, { title: v.title, description: v.description }]))
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

// Category names are navigational ("ПТСР", "Криза") — presence is enough.
function scoreCategoryTitle(title: string | null): { points: number; warning: string | null } {
  if (!title) return { points: 0, warning: 'Відсутній <title>' }
  return { points: SCORE_TITLE_LENGTH, warning: null }
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
  // null here means "not assessable" (hero composed client-side) — do not punish.
  if (h1 === null) return { points: SCORE_H1, warning: null }
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

// Listing pages (indexes, category hubs) render entity lists, not article body.
function scoreListing(): { points: number; warning: string | null } {
  return { points: SCORE_CONTENT, warning: null }
}

/* ── Audit collection ── */

async function collectStaticPages(overrides: Map<string, SeoOverride>): Promise<SeoUrlRow[]> {
  const db = getDB()
  const all = await db
    .select()
    .from(pages)
    .leftJoin(pageTranslations, eq(pages.id, pageTranslations.pageId))
    .all()

  const rows: SeoUrlRow[] = []
  for (const page of STATIC_PAGES) {
    for (const locale of ['ru', 'uk'] as const) {
      const url = `/${locale}/${page.slug}`
      const base = page.slug.replace(/\/$/, '') || 'home'
      const fb = MESSAGES_FALLBACK[`${base}|${locale}`]
      const pageType = STATIC_PAGE_TYPE[page.slug]

      let title: string | null = fb?.title ?? null
      let description: string | null = fb?.description ?? null
      const h1: string | null = fb?.h1 ?? null
      let entityId = base

      if (pageType) {
        const match = all.find((r) => r.pages.type === pageType && r.page_translations?.locale === locale)
        if (match) {
          entityId = match.pages.id
          const ov = overrides.get(`page|${match.pages.id}|${locale}`)
          title = ov?.title ?? fb?.title ?? null
          description = ov?.description ?? fb?.description ?? null
        }
      }

      // Static pages are section-composed; body text lives in sections/messages —
      // the audit evaluates title/description/H1, content is not punishable here.
      const contentScore = scoreListing()

      const titleScore = scoreTitle(title)
      const descScore = scoreDescription(description)
      const h1Score = scoreH1(h1)
      const total = titleScore.points + descScore.points + h1Score.points + contentScore.points

      const warnings = [titleScore.warning, descScore.warning, h1Score.warning, contentScore.warning].filter(Boolean) as string[]

      rows.push({
        url,
        locale,
        entityType: 'static_page',
        entityId,
        title,
        description,
        h1,
        hasContent: true,
        wordCount: 0,
        score: total,
        warnings,
      })
    }
  }
  return rows
}

async function collectServices(overrides: Map<string, SeoOverride>): Promise<SeoUrlRow[]> {
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
    const ov = overrides.get(`service|${row.services.id}|${trans.locale}`)
    const title = ov?.title ?? trans.title ?? null
    const description = ov?.description ?? trans.description ?? null
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

async function collectBlogPosts(overrides: Map<string, SeoOverride>): Promise<SeoUrlRow[]> {
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
    const ov = overrides.get(`blog_post|${row.blog_posts.id}|${trans.locale}`)
    const title = ov?.title ?? trans.title ?? null
    const description = ov?.description ?? trans.excerpt ?? null
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

async function collectBlogCategories(overrides: Map<string, SeoOverride>): Promise<SeoUrlRow[]> {
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
    const ov = overrides.get(`blog_category|${row.blog_categories.id}|${trans.locale}`)
    const title = ov?.title ?? trans.name ?? null
    const description = ov?.description ?? trans.description ?? null
    const h1 = trans.name ?? null

    const titleScore = scoreCategoryTitle(title)
    const descScore = scoreDescription(description)
    const h1Score = scoreH1(h1 === null ? null : h1 || null)
    const contentScore = scoreListing()
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
      hasContent: true,
      wordCount: 0,
      score: total,
      warnings,
    })
  }
  return rows
}

/* ── Public API ── */

export async function runSeoAudit(): Promise<SeoUrlRow[]> {
  const overrides = await loadSeoOverrides()

  // Collect from all sources in parallel
  const [staticPages, svc, posts, cats] = await Promise.all([
    collectStaticPages(overrides),
    collectServices(overrides),
    collectBlogPosts(overrides),
    collectBlogCategories(overrides),
  ])

  const results: SeoUrlRow[] = []
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
