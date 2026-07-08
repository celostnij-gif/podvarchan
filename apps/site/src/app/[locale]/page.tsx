import type { Metadata } from 'next'
import { getTranslations, getMessages } from 'next-intl/server'
import { SITE } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { aggregateRatingSchema } from '@/lib/schema'
import type { Testimonial } from '@/types'
import HomeClient from './home-client'
import Hero from '@/components/sections/Hero'

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
  const t = await getTranslations({ locale, namespace: 'hero' })
  const commonT = await getTranslations({ locale, namespace: 'common' })
  const webPageSchema = await getWebPageSchema(locale)

  const testimonials = (messages?.testimonials?.items as Testimonial[]) ?? []

  const ratingSchema = testimonials.length > 0
    ? aggregateRatingSchema(testimonials.map((t, i) => ({
        author: t.name,
        rating: t.rating ?? 5,
        date: new Date(2025, 5 + (i % 12), 1).toISOString().split('T')[0],
        text: t.text,
        result: t.result,
      })))
    : null
  const pageSchemas: Record<string, unknown>[] = ratingSchema ? [webPageSchema, ratingSchema] : [webPageSchema]

  return (
    <>
      <Hero t={t} commonT={commonT} />
      <HomeClient locale={locale} schemas={pageSchemas} />
    </>
  )

}
