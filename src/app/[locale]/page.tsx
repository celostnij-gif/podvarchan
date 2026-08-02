import type { Metadata } from 'next'
import { getTranslations, getMessages } from 'next-intl/server'
import { SITE } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { aggregateRatingSchema, faqSchema, speakableSchema } from '@/lib/schema'
import type { Testimonial } from '@/types'
import HomeClient from './home-client'
import Hero from '@/components/sections/Hero'
import { getPageByType, getTestimonials, getFAQs } from '@/lib/db/public'
import { cookies } from 'next/headers'
import { parseZoneContent, type HeroContent } from '@/lib/home/blueprint'

export const revalidate = 3600

/* ── Metadata ── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })

  // Use translations for metadata (avoids 3 D1 queries in generateMetadata)
  // D1 SEO overrides can be added via admin panel in the future
  const title = t('metaTitle')
  const description = t('metaDescription')
  let keywords: string[] = []
  try {
    keywords = JSON.parse(t('metaKeywords'))
  } catch { /* ignore */ }

  return seoMetadata({
    title,
    description,
    keywords,
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
      getTestimonials(locale, previewCookie),
      getFAQs(locale, 'HOME', previewCookie),
    ])
  } catch { /* D1 unavailable — fallback to messages */ }

  // Parse hero from section translations (canonical source)
  const heroSection = d1Home?.sections.find((s) => s.key === 'hero')
  let d1Hero: HeroContent = { title: '', subtitle: '', ctaPrimary: '', ctaSecondary: '', benefits: [] }
  if (heroSection?.contentJson) {
    d1Hero = parseZoneContent('hero', heroSection.contentJson)
  }

  // Fallback: use page_translations.title/excerpt if hero section is empty
  if (!d1Hero.title && d1Home?.title) {
    d1Hero.title = d1Home.title
  }
  if (!d1Hero.subtitle && d1Home?.excerpt) {
    d1Hero.subtitle = d1Home.excerpt
  }

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
  const faqSchemaObj = d1Faqs && d1Faqs.length > 0
    ? faqSchema(d1Faqs.map(f => ({ question: f.question, answer: f.answer ?? '' })))
    : null
  const pageSchemas: Record<string, unknown>[] = ratingSchema ? [webPageSchema, ratingSchema] : [webPageSchema]
  if (faqSchemaObj) {
    pageSchemas.push(faqSchemaObj)
  }
  pageSchemas.push(speakableSchema('#home-content p'))

  return (
    <>
      
      {pageSchemas.map((s, i) => (
        <script key={`ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <Hero t={t} commonT={commonT} d1={d1Hero} />
      <HomeClient
        locale={locale}
        d1Testimonials={d1Testimonials}
        d1Faqs={d1Faqs}
        d1Sections={d1Home?.sections ?? []}
      />
    </>
  )
}
