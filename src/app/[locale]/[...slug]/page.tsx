import { getDB } from '@/db'
import { pages, pageTranslations, pageSections, pageSectionTranslations } from '@/db/schema/pages'
import { eq, and } from 'drizzle-orm'
import type { Metadata } from 'next'
import Link from 'next/link'
interface Props {
  params: Promise<{ slug: string[]; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: slugPath, locale } = await params
  const slug = slugPath.join('/')

  const db = getDB()
  const translation = await db
    .select()
    .from(pageTranslations)
    .innerJoin(pages, eq(pageTranslations.pageId, pages.id))
    .where(and(eq(pageTranslations.slug, slug), eq(pageTranslations.locale, locale as 'ru' | 'uk'), eq(pages.status, 'PUBLISHED')))
    .get()

  if (!translation) {
    return {
      robots: { index: false, follow: false },
    }
  }

  return {
    title: translation.page_translations.title ?? undefined,
    description: translation.page_translations.excerpt ?? undefined,
  }
}

/** Simple renderer for section content JSON */
function renderContentJson(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return { text: raw }
  }
}

const SECTION_STYLES: Record<string, string> = {
  hero: 'bg-gradient-to-br from-blue-50 to-indigo-50 py-20',
  'text-block': 'py-12',
  'image-text': 'py-12',
  stats: 'bg-gray-50 py-16',
  timeline: 'py-12',
  gallery: 'py-12 bg-gray-50',
  'video-embed': 'py-12',
  'services-grid': 'py-12 bg-gray-50',
  'faq-group-ref': 'py-12',
  'testimonials-ref': 'py-12 bg-gray-50',
  cta: 'bg-blue-600 py-16 text-white',
  'contact-form': 'py-12 bg-gray-50',
}

function SectionRenderer({ section, translation }: { section: typeof pageSections.$inferSelect; translation: { contentJson: string | null } }) {
  const style = SECTION_STYLES[section.type] || 'py-12'
  const content = renderContentJson(translation.contentJson)

  return (
    <section className={style} key={section.key}>
      <div className="mx-auto max-w-6xl px-4">
        {section.type === 'hero' && (
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              {String(content.title ?? '')}
            </h1>
            {Boolean(content.subtitle) && (
              <p className="mx-auto max-w-2xl text-lg text-gray-600">
                {String(content.subtitle)}
              </p>
            )}
          </div>
        )}

        {section.type === 'text-block' && (
          <div className="prose prose-lg mx-auto max-w-3xl">
            {Boolean(content.text) && <div>{String(content.text)}</div>}
            {Boolean(content.html) && <div dangerouslySetInnerHTML={{ __html: String(content.html) }} />}
          </div>
        )}

        {section.type === 'cta' && (
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold">
              {String(content.title ?? '')}
            </h2>
            <p className="mb-6 text-lg opacity-90">
              {String(content.text ?? '')}
            </p>
            {Boolean(content.button_text) && Boolean(content.button_url) && (
              <a
                href={String(content.button_url)}
                className="inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-gray-100"
              >
                {String(content.button_text)}
              </a>
            )}
          </div>
        )}

        {!['hero', 'text-block', 'cta'].includes(section.type) && (
          <div>
            {Boolean(content.title) && (
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                {String(content.title)}
              </h2>
            )}
            <p className="text-gray-500">
              Секция «{section.type}» — рендеринг будет добавлен позже.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default async function CatchAllPage({ params }: Props) {
  const { slug: slugPath, locale } = await params
  const slug = slugPath.join('/')

  const db = getDB()

  // Look up the page by slug + locale
  const pageRow = await db
    .select()
    .from(pageTranslations)
    .innerJoin(pages, eq(pageTranslations.pageId, pages.id))
    .where(and(eq(pageTranslations.slug, slug), eq(pageTranslations.locale, locale as 'ru' | 'uk')))
    .get()

  if (!pageRow) {
    return <NotFound />
  }

  const page = pageRow.pages
  const translation = pageRow.page_translations
  // Only render published CUSTOM pages
  if (page.status !== 'PUBLISHED' || page.type !== 'CUSTOM') {
    return <NotFound />
  }
  // Load sections
  const sectionRows = await db
    .select()
    .from(pageSections)
    .leftJoin(pageSectionTranslations, and(
      eq(pageSections.id, pageSectionTranslations.sectionId),
      eq(pageSectionTranslations.locale, locale as 'ru' | 'uk'),
    ))
    .where(and(eq(pageSections.pageId, page.id), eq(pageSections.enabled, true)))
    .orderBy(pageSections.sortOrder)
    .all()

  return (
    <main>
      {/* Page content */}
      {sectionRows.map((row) => (
        <SectionRenderer
          key={row.page_sections.id}
          section={row.page_sections}
          translation={{
            contentJson: row.page_section_translations?.contentJson ?? null,
          }}
        />
      ))}

      {/* Empty page */}
      {sectionRows.length === 0 && (
        <div className="py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            {translation.title}
          </h1>
          <p className="text-gray-500">Содержимое страницы пусто</p>
        </div>
      )}
    </main>
  )
}

function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">Страница не найдена</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800 underline">На главную</Link>
      </div>
    </main>
  )
}
