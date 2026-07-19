import type { Metadata } from 'next'
import { getTranslations, getMessages } from 'next-intl/server'
import { SITE } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { aggregateRatingSchema } from '@/lib/schema'
import type { Testimonial } from '@/types'
import HomeClient from './home-client'
import Hero from '@/components/sections/Hero'
import { getPageByType, getTestimonials, getFAQs } from '@/lib/db/public'
import { cookies } from 'next/headers'

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

  // D1 data with fallback
  let d1Testimonials: Awaited<ReturnType<typeof getTestimonials>> = []
  let d1Faqs: Awaited<ReturnType<typeof getFAQs>> = []
  let d1Home: Awaited<ReturnType<typeof getPageByType>> | null = null

  const previewCookie = (await cookies()).get('__preview')?.value
  try {
    ;[d1Home, d1Testimonials, d1Faqs] = await Promise.all([
      getPageByType('HOME', locale, previewCookie),
      getTestimonials(locale),
      getFAQs(locale, 'HOME'),
    ])
  } catch { /* D1 unavailable — fallback to messages */ }

  const testimonials = (messages?.testimonials?.items as Testimonial[]) ?? []
  const ratingSchema = testimonials.length > 0 || d1Testimonials.length > 0
    ? aggregateRatingSchema((d1Testimonials.length > 0 ? d1Testimonials : testimonials).map((t, i) => ({
        author: t.name ?? '',
        rating: t.rating ?? 5,
        date: new Date(2025, 5 + (i % 12), 1).toISOString().split('T')[0],
        text: t.text ?? '',
        result: t.result ?? '',
      })))
    : null
  const pageSchemas: Record<string, unknown>[] = ratingSchema ? [webPageSchema, ratingSchema] : [webPageSchema]

  return (
    <>
      <Hero t={t} commonT={commonT} />
      <HomeClient
        locale={locale}
        schemas={pageSchemas}
        d1Testimonials={d1Testimonials}
        d1Faqs={d1Faqs}
        d1Sections={d1Home?.sections ?? []}
      />
    </>
  )
}
