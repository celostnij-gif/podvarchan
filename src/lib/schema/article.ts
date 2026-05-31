import { SITE } from '@/constants'
import { cleanUrl } from './utils'

interface ArticleSchemaParams {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  image?: string
  authorName?: string
  locale?: string
}

/**
 * Генерирует JSON-LD объект Article schema.org для статей блога.
 * Автоматически подключает автора через @id ссылку на Person.
 */

export function articleSchema(params: ArticleSchemaParams): Record<string, unknown> {
  const {
    headline,
    description,
    url,
    datePublished,
    dateModified,
    image,
    authorName = SITE.authorName,
    locale,
  } = params

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: cleanUrl(SITE.url, locale === 'ru' ? 'ru' : locale ?? '', url),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': cleanUrl(SITE.url, locale === 'ru' ? 'ru' : locale ?? '', url),
    },
    author: {
      '@type': 'Person',
      '@id': `${SITE.url}/ob-avtore/#person`,
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.fullName,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/images/logo.png`,
      },
    },
    datePublished,
    dateModified,
    image: image ? cleanUrl(SITE.url, image) : undefined,
  }
}
