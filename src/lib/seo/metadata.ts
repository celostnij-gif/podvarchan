import type { Metadata } from 'next'
import { SITE } from '@/constants'
import type { PageMeta } from '@/types'

interface GenerateMetadataParams extends PageMeta {
  path: string
  locale?: string
  /** If UK slug differs from RU, pass UK path for correct hreflang and canonical */
  ukPath?: string
}

/**
 * Builds canonical URL respecting locale prefix.
 * localePrefix: 'always' — both locales get prefix in URL.
 */
export function buildCanonical(path: string, locale: string): string {
  const base = SITE.url
  const localePrefix = locale === 'ru' ? '/ru' : '/uk'
  const cleanPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
  const suffix = cleanPath && !cleanPath.endsWith('/') ? '/' : ''
  return `${base}${localePrefix}${cleanPath}${suffix}`
}

/**
 * Generates full Metadata object for Next.js App Router.
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
  ukPath,
}: GenerateMetadataParams): Metadata {
  const langPrefix = locale === 'ru' ? '/ru' : '/uk'
  // When on UK page with different slug, use ukPath for canonical URL
  const isUkWithUkPath = locale === 'uk' && ukPath
  const effectivePath = isUkWithUkPath ? ukPath : path
  const canonicalUrl = canonical ?? `${SITE.url}${langPrefix}${effectivePath}/`
  const ogLocale = locale === 'uk' ? 'uk_UA' : 'ru_RU'
  const imageUrl = ogImage ?? `${SITE.url}${SITE.defaultOgImage}`

  const other: Record<string, string> = {}
  if (publishedTime) other['article:published_time'] = publishedTime
  if (modifiedTime) other['article:modified_time'] = modifiedTime
  if (author) other['article:author'] = author

  // Hreflang: use ukPath when UK slug differs from RU slug
  const ukHref = ukPath ? `${SITE.url}/uk${ukPath}/` : `${SITE.url}/uk${path}/`
  const defaultHref = `${SITE.url}/ru${path}/`

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
        uk: ukHref,
        'x-default': defaultHref,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE.fullName,
      locale: ogLocale,
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
 * Generates JSON-LD script.
 */
export function jsonLd(schema: Record<string, unknown>): string {
  return JSON.stringify(schema, null, 2)
}
