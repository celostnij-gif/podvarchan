import { SITE } from '@/constants'
import { cleanUrl } from './utils'

interface ArticleSchemaParams {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  image?: string
  imageAlt?: string
  imageCaption?: string
  authorName?: string
  locale?: string
  /** Категория для YMYL-маркировки: 'clinical' для ПТСР/панические атаки/тревога */
  category?: string
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
    imageAlt,
    imageCaption,
    authorName = SITE.authorName,
    locale,
    category,
  } = params

  /* ── Image: если есть alt-текст, используем ImageObject ── */
  const imageSchema = image
    ? imageAlt
      ? {
          '@type': 'ImageObject' as const,
          url: cleanUrl(SITE.url, image),
          caption: imageCaption ?? imageAlt,
          description: imageAlt,
        }
      : cleanUrl(SITE.url, image)
    : undefined

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    inLanguage: locale === 'uk' ? 'uk' : 'ru',
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
        url: `${SITE.url}/logo.webp`,
      },
    },
    datePublished,
    dateModified,
    image: imageSchema,
  }

  // YMYL: додаємо reviewedBy для клінічних категорій (ПТСР, панічні атаки, тривога)
  if (category === 'clinical') {
    const reviewedByDesc = locale === 'uk'
      ? 'Автор — сертифікований гіпнотерапевт (ABH), практик НЛП (INLPTA), магістр музичної терапії (The University of Kansas). Матеріал базується на особистому досвіді роботи з клієнтами та професійній освіті.'
      : 'Автор — сертифицированный гипнотерапевт (ABH), практик НЛП (INLPTA), магистр музыкальной терапии (The University of Kansas). Материал базируется на личном опыте работы с клиентами и профессиональном образовании.'
    schema.reviewedBy = {
      '@type': 'Person',
      '@id': `${SITE.url}/ob-avtore/#person`,
      name: authorName || SITE.authorName,
      description: reviewedByDesc,
    }
  }

  return schema
}
