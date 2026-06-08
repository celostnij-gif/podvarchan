import type { Metadata } from 'next'
import { getTranslations, getMessages } from 'next-intl/server'
import { SITE } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { aggregateRatingSchema } from '@/lib/schema'
import { getPublishedTestimonials } from '@/lib/content'
import type { Testimonial } from '@/types'
import HomeClient from './home-client'

/* ── Metadata ── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  return seoMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: JSON.parse(t('metaKeywords')),
    path: '',
    type: 'page',
    locale,
  })
}

/* ── WebPage JSON-LD ── */

async function getWebPageSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'home' })

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE.url}/${locale}/#webpage`,
    url: `${SITE.url}/${locale}`,
    name: t('metaTitle'),
    description: t('metaDescription'),
    inLanguage: locale === 'uk' ? 'uk-UA' : 'ru-RU',
    isPartOf: {
      '@id': `${SITE.url}/#website`,
    },
    about: {
      '@id': `${SITE.url}/ob-avtore/#person`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE.url}${SITE.defaultOgImage}`,
    },
  }
}

/* ── Home Page ── */

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const webPageSchema = await getWebPageSchema(locale)

  /* ── AggregateRating schema from testimonials ── */
  let testimonials: Testimonial[] = []
  try {
    const fromDb = await getPublishedTestimonials(locale)
    if (fromDb && fromDb.length > 0) {
      testimonials = fromDb.map(t => ({
        id: t.id,
        name: t.clientName,
        text: t.translation.text,
        result: t.translation.result ?? '',
        rating: t.rating ?? 5,
      }))
    }
  } catch {
    // D1 not available
  }
  if (testimonials.length === 0) {
    testimonials = (messages?.testimonials?.items as Testimonial[]) ?? []
  }
  const reviews = testimonials.map((t, i) => ({
    author: t.name,
    rating: t.rating ?? 5,
    date: new Date(2025, 5 + (i % 12), 1).toISOString().split('T')[0],
    text: t.text,
    result: t.result,
  }))

  const ratingSchema = reviews.length > 0
    ? aggregateRatingSchema(reviews)
    : null

  const pageSchemas = ratingSchema
    ? [webPageSchema, ratingSchema]
    : [webPageSchema]

  return <HomeClient locale={locale} schemas={pageSchemas} />
}
