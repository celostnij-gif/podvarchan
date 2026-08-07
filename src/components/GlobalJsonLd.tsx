import { getTranslations } from 'next-intl/server'
import { SITE } from '@/constants'
import { personSchema, practiceSchema, renderJsonLd } from '@/lib/schema'

/**
 * Global JSON-LD (Person, ProfessionalService, WebSite) — рендерится на уровне
 * СТРАНИЦЫ (page segment), не в layout: OpenNext рендерит layout-level скрипты
 * снаружи suspense-маркеров, и React при гидрации повторно вставляет их в DOM
 * (hydration duplicates — см. 1de8eed). Page-level сегменты дублей не дают.
 *
 * `breadcrumb` — статический fallback BreadcrumbList только для главной
 * (там нет hero-крошек); остальные страницы рендерят крошки через HeroBreadcrumbs.
 */
export async function GlobalJsonLd({
  locale,
  breadcrumb,
}: {
  locale: string
  breadcrumb?: boolean
}) {
  const t = await getTranslations({ locale, namespace: 'common' })

  const schemas: Record<string, unknown>[] = [
    personSchema({ jobTitle: t('authorTitle'), locale }),
    await practiceSchema(locale),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.fullName,
      description: SITE.fullName,
      inLanguage: locale === 'uk' ? 'uk' : 'ru',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE.url}/${locale}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: SITE.fullName,
        url: SITE.url,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE.url}/logo.webp`,
        },
      },
    },
  ]

  if (breadcrumb) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${SITE.url}/${locale}/#breadcrumb-fallback`,
      inLanguage: locale === 'uk' ? 'uk' : 'ru',
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        name: t('siteName'),
        url: `${SITE.url}/${locale}/`,
      }],
    })
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`global-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(schema) }}
        />
      ))}
    </>
  )
}
