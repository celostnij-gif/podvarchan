import { getTranslations } from 'next-intl/server'
import { SITE } from '@/constants'
import { personSchema, practiceSchema } from '@/lib/schema'

/**
 * Глобальные JSON-LD схемы (Person, ProfessionalService, WebSite).
 *
 * Рендерятся на уровне страницы (page segment), а не layout: layout-level
 * suspense boundary в OpenNext-воркере отдаётся как «resolved-empty»
 * (`<div hidden=""><!--$--><!--/$--></div>`), из-за чего React при гидратации
 * заново вставляет содержимое границы → дубль скриптов в DOM (Person×2,
 * ProfessionalService×2, WebSite×2). Page-level сегменты в воркере
 * структурируются корректно (проверено на FAQPage) — дублей нет.
 *
 * SSR-вывод сохраняется: скрипты по-прежнему присутствуют в исходном HTML.
 */
export async function GlobalSchemas({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'common' })

  const schemas: Record<string, unknown>[] = [
    personSchema({ jobTitle: t('authorTitle'), locale }),
    practiceSchema(locale),
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
          url: `${SITE.url}/api/media/logo.webp`,
        },
      },
    },
  ]

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={`ld-global-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  )
}
