import { notFound } from 'next/navigation'
import { getDB } from '@/db'
import { services, serviceTranslations } from '@/db/schema/services'
import { blogPosts, blogPostTranslations } from '@/db/schema/blog'
import { pages, pageTranslations } from '@/db/schema/pages'
import { eq } from 'drizzle-orm'
import { getSeoOverride } from '@/lib/actions/seo'
import { SeoEditForm } from './seo-edit-form'

interface Props {
  params: Promise<{ entityType: string; entityId: string }>
}

/** YMYL check for medical/health content. */
function checkYmyl(entityType: string, title: string | null, description: string | null): { isYmyl: boolean; signals: string[]; missing: string[] } {
  const isMedical = entityType === 'service' || entityType === 'blog_post'
  if (!isMedical) {
    return { isYmyl: false, signals: [], missing: [] }
  }

  const signals: string[] = []
  const missing: string[] = []

  // Check for author signal
  const fullText = `${title ?? ''} ${description ?? ''}`.toLowerCase()
  if (fullText.includes('подварчан') || fullText.includes('vyacheslav') || fullText.includes('специалист') || fullText.includes('сертифицирован')) {
    signals.push('Згадка автора знайдена')
  } else {
    missing.push('Немає згадки автора/спеціаліста в заголовку/описі')
  }

  // Check for certification/experience signals
  if (fullText.includes('сертифи') || fullText.includes('гипнотерапевт') || fullText.includes('психолог') || fullText.includes('опыт')) {
    signals.push('Сигнали E-E-A-T (сертифікація/досвід) знайдені')
  } else {
    missing.push('Немає сигналів E-E-A-T (сертифікація, досвід) в метаданих')
  }

  // Date signal
  if (fullText.includes('202') || fullText.includes('дата')) {
    signals.push('Сигнал дати/актуальності знайдено')
  } else {
    missing.push('Немає сигналу дати/актуальності в метаданих')
  }

  return { isYmyl: true, signals, missing }
}

async function getEntityData(entityType: string, entityId: string) {
  const db = getDB()

  switch (entityType) {
    case 'service': {
      const row = await db
        .select()
        .from(services)
        .leftJoin(serviceTranslations, eq(services.id, serviceTranslations.serviceId))
        .where(eq(services.id, entityId))
        .all()
      return row.map((r) => ({
        ...r.services,
        translation: r.service_translations,
        locale: r.service_translations?.locale ?? 'ru',
        title: r.service_translations?.title ?? null,
        description: r.service_translations?.description ?? null,
      }))
    }
    case 'blog_post': {
      const row = await db
        .select()
        .from(blogPosts)
        .leftJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
        .where(eq(blogPosts.id, entityId))
        .all()
      return row.map((r) => ({
        ...r.blog_posts,
        translation: r.blog_post_translations,
        locale: r.blog_post_translations?.locale ?? 'ru',
        title: r.blog_post_translations?.title ?? null,
        description: r.blog_post_translations?.excerpt ?? null,
      }))
    }
    case 'static_page':
    case 'page': {
      const row = await db
        .select()
        .from(pages)
        .leftJoin(pageTranslations, eq(pages.id, pageTranslations.pageId))
        .where(eq(pages.id, entityId))
        .all()
      return row.map((r) => ({
        ...r.pages,
        translation: r.page_translations,
        locale: r.page_translations?.locale ?? 'ru',
        title: r.page_translations?.title ?? null,
        description: r.page_translations?.excerpt ?? null,
      }))
    }
    default:
      return null
  }
}

export default async function SeoDetailPage(props: Props) {
  const { entityType, entityId } = await props.params

  const entries = await getEntityData(entityType, entityId)
  if (!entries || entries.length === 0) notFound()

  // For now show the first locale entry (RU)
  const ruEntry = entries.find((e) => e.locale === 'ru') ?? entries[0]
  const ukEntry = entries.find((e) => e.locale === 'uk')

  const ruSeoOverride = await getSeoOverride(entityType, entityId, 'ru')
  const ukSeoOverride = ukEntry ? await getSeoOverride(entityType, entityId, 'uk') : null

  const entityUrl = `/${ruEntry.locale}/${entityType === 'service' ? 'uslugi' : entityType === 'blog_post' ? 'blog' : ''}/${ruEntry.translation?.slug ?? ''}`
  const ymylResult = checkYmyl(entityType, ruSeoOverride?.title ?? ruEntry.title, ruSeoOverride?.description ?? ruEntry.description)

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-200">
          SEO: {entityType} / {entityId.slice(0, 8)}...
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          <a href={entityUrl} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">
            {entityUrl}
          </a>
        </p>
      </div>

      {/* Google Snippet Preview */}
      <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Попередній перегляд сниппета Google</h2>
        <div className="rounded border border-zinc-700 bg-zinc-800/80 p-3" style={{ maxWidth: 600 }}>
          <div className="text-xs text-green-400">{entityUrl.replace(/^\/(ru|uk)\//, 'Podvarchan.com › ').replace(/\/$/, '')}</div>
          <div className="text-[18px] font-medium leading-6 text-blue-300 hover:underline">
            {ruSeoOverride?.title ?? ruEntry.title ?? 'Без заголовка'}
          </div>
          <div className="mt-1 text-sm leading-5 text-zinc-400">
            {ruSeoOverride?.description ?? ruEntry.description ?? 'Без опису'}
          </div>
        </div>
      </div>

      {/* SEO Edit Form */}
      <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">SEO-перевизначення — RU</h2>
        <SeoEditForm
          entityType={entityType}
          entityId={entityId}
          locale="ru"
          defaults={{
            title: ruSeoOverride?.title ?? ruEntry.title ?? '',
            description: ruSeoOverride?.description ?? ruEntry.description ?? '',
            keywords: ruSeoOverride?.keywords ?? '',
            canonicalPath: ruSeoOverride?.canonicalPath ?? '',
            ogTitle: ruSeoOverride?.ogTitle ?? '',
            ogDescription: ruSeoOverride?.ogDescription ?? '',
          }}
        />
      </div>

      {ukEntry && (
        <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-200">SEO-перевизначення — UK</h2>
          <SeoEditForm
            entityType={entityType}
            entityId={entityId}
            locale="uk"
            defaults={{
              title: ukSeoOverride?.title ?? ukEntry.title ?? '',
              description: ukSeoOverride?.description ?? ukEntry.description ?? '',
              keywords: ukSeoOverride?.keywords ?? '',
              canonicalPath: ukSeoOverride?.canonicalPath ?? '',
              ogTitle: ukSeoOverride?.ogTitle ?? '',
              ogDescription: ukSeoOverride?.ogDescription ?? '',
            }}
          />
        </div>
      )}

      {/* YMYL Check */}
      <div className="mb-8 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-200">
          Оцінка YMYL
          {ymylResult.isYmyl && <span className="ml-2 rounded bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-700/30">Медичний</span>}
        </h2>
        {ymylResult.isYmyl ? (
          <div>
            {ymylResult.signals.length > 0 && (
              <div className="mb-3">
                <h3 className="mb-1 text-sm font-medium text-green-400">✓ Сигнали E-E-A-T присутні</h3>
                <ul className="list-inside list-disc text-sm text-green-400">
                  {ymylResult.signals.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {ymylResult.missing.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-red-400">✗ Відсутні сигнали</h3>
                <ul className="list-inside list-disc text-sm text-red-400">
                  {ymylResult.missing.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Цей тип контенту не потребує оцінки YMYL.</p>
        )}
      </div>
    </div>
  )
}
