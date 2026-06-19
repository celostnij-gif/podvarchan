import type { Metadata } from 'next'
import { SITE } from '@/constants'
import type { PageMeta } from '@/types'

interface GenerateMetadataParams extends PageMeta {
  path: string
  locale?: string
}

/**
 * Строит канонический URL с учётом локали.
 * localePrefix: 'always' — обе локали имеют префикс в URL.
 */
export function buildCanonical(path: string, locale: string): string {
  const base = SITE.url
  const localePrefix = locale === 'ru' ? '/ru' : '/uk'
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  // Keep trailing slash — consistent with trailingSlash:true in next.config
  const normalizedPath = cleanPath
  return `${base}${localePrefix}${normalizedPath}`
}

/**
 * Генерирует полный объект Metadata для Next.js App Router.
 *
 * @example
 * ```ts
 * export const metadata = generateMetadata({
 *   title: 'Гипнотерапия онлайн',
 *   description: '...',
 *   path: '/uslugi/gipnoterapiya-onlayn',
 *   type: 'service',
 * })
 * ```
 */
export function generateMetadata({
  title,
  description,
  keywords,
  type = 'page',
  canonical,
  ogImage,
  publishedTime,
  modifiedTime,
  author,
  path,
  locale = 'ru',
}: GenerateMetadataParams): Metadata {
  const langPrefix = locale === 'ru' ? '/ru' : '/uk'
  const canonicalUrl = canonical ?? `${SITE.url}${langPrefix}${path}/`
  const imageUrl = ogImage ?? `${SITE.url}${SITE.defaultOgImage}`

  // Build other meta tags separately to avoid fragile type casting
  const other: Record<string, string> = {}
  if (publishedTime) other['article:published_time'] = publishedTime
  if (modifiedTime) other['article:modified_time'] = modifiedTime
  if (author) other['article:author'] = author

  return {
    title: {
      default: title,
      template: `%s | ${SITE.authorName}`,
    },
    description,
    keywords: keywords?.length ? keywords : undefined,
    metadataBase: new URL(SITE.url),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ru: `${SITE.url}/ru${path}/`,
        uk: `${SITE.url}/uk${path}/`,
        'x-default': `${SITE.url}/ru${path}/`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE.fullName,
      locale,
      type: type === 'article' ? 'article' : 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: Object.keys(other).length > 0 ? other : undefined,
  }
}

/**
 * Генерирует JSON-LD скрипт для вставки в layout.tsx или страницу.
 * Использование: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />`
 */
export function jsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 2)
}
