import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { SITE } from '@/constants'
import { breadcrumbSchema } from '@/lib/schema'
import { getPageByType, getPageSeoMeta, getPricingPlans } from '@/lib/db/public'
import { cookies } from 'next/headers'
import { TsenyClient } from './client-page'
export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tseny' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('PRICING', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
    keywords: ['цена гипнотерапии', 'стоимость сессии гипноза', 'гипнотерапия онлайн цена', 'сколько стоит гипнотерапия'],
    path: '/tseny',
    ukPath: '/tsiny',
    locale,
  })
}

async function getOfferSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'tseny' })
  const plans = await getPricingPlans(locale).catch(() => null)
  const priceValidUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]

  let offers: Record<string, unknown>[]
  if (plans && plans.length > 0) {
    // Цены из D1 (pricing_plans) — единый источник прайса.
    offers = plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.title,
      description: plan.description ?? plan.subtitle ?? undefined,
      price: String(plan.price),
      priceCurrency: plan.currency,
      availability: 'https://schema.org/InStock',
      url: `${SITE.url}/${locale}/kontakty/`,
      priceValidUntil,
    }))
  } else {
    // Fallback: D1 недоступен — константные позиции из messages.
    offers = [
      {
        '@type': 'Offer',
        name: t('freeConsultationTitle'),
        description: t('freeConsultationDesc'),
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE.url}/${locale}/kontakty/`,
        priceValidUntil,
      },
      {
        '@type': 'Offer',
        name: t('singleSessionTitle'),
        description: t('singleSessionDesc'),
        price: '50',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE.url}/${locale}/kontakty/`,
        priceValidUntil,
      },
    ]
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE.url}/tseny/#product`,
    name: t('metaTitle'),
    description: t('metaDescription'),
    offers,
  }
}
export default async function TsenyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const offerSchema = await getOfferSchema(locale)
  const pricingPlans = await getPricingPlans(locale).catch(() => [])
  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  const previewCookie = (await cookies()).get('__preview')?.value
  try {
    d1Page = await getPageByType('PRICING', locale, previewCookie)
  } catch { /* D1 unavailable */ }

  const t = await getTranslations({ locale, namespace: 'tseny' })
  const commonT = await getTranslations({ locale, namespace: 'common' })
  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: t('badgeLabel'), href: locale === 'uk' ? '/tsiny/' : '/tseny/' },
  ]
  const schemas: Record<string, unknown>[] = [offerSchema]
  schemas.push(breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale }))

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={schemas} />
      <TsenyClient breadcrumbs={breadcrumbs} pricingPlans={pricingPlans} d1Sections={d1Page?.sections ?? []} />
    </>
  )
}
