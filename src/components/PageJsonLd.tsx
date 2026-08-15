import { renderJsonLd } from '@/lib/schema'

/**
 * PageJsonLd — SSR рендер page-specific JSON-LD схем (WebPage, BlogPosting,
 * FAQPage, Service, Product/Offer, Speakable, BreadcrumbList и т.п.).
 *
 * Рендерится в server component на уровне страницы (как GlobalJsonLd):
 * схемы попадают в сырой HTML ответа — критично для краулеров без JS
 * (AGENTS.md §5, FINAL_ROADMAP 5.1). Клиентская регистрация схем запрещена.
 */
export function PageJsonLd({ schemas }: { schemas: Record<string, unknown>[] }) {
  if (schemas.length === 0) return null

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`page-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }}
        />
      ))}
    </>
  )
}
