import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { SITE } from '@/constants'
import { getPageByType, getSEOMeta } from '@/lib/db/public'
import { cookies } from 'next/headers'
import { JsonLd } from '@/components/JsonLd'
import { TsenyClient } from './client-page'
export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tseny' })

  let seoTitle = t('metaTitle')
  let seoDescription = t('metaDescription')
  try {
    const previewCookie = (await cookies()).get('__preview')?.value
    const page = await getPageByType('PRICING', locale, previewCookie)
    if (page?.id) {
      const seo = await getSEOMeta('page', page.id, locale).catch(() => null)
      if (seo?.title) seoTitle = seo.title
      if (seo?.description) seoDescription = seo.description
    }
  } catch { /* D1 unavailable */ }

  return seoMetadata({
    title: seoTitle,
    description: seoDescription,
    keywords: ['цена гипнотерапии', 'стоимость сессии гипноза', 'гипнотерапия онлайн цена', 'сколько стоит гипнотерапия'],
    path: '/tseny',
    ukPath: '/tsiny',
    locale,
  })
}

async function getOfferSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'tseny' })

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE.url}/tseny/#product`,
    name: t('metaTitle'),
    description: t('metaDescription'),
    offers: [
      {
        '@type': 'Offer',
        name: t('freeConsultationTitle'),
        description: t('freeConsultationDesc'),
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE.url}/${locale}/kontakty/`,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      },
      {
        '@type': 'Offer',
        name: t('singleSessionTitle'),
        description: t('singleSessionDesc'),
        price: '50',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: `${SITE.url}/${locale}/kontakty/`,
        priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      },
    ],
  }
}

export default async function TsenyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const offerSchema = await getOfferSchema(locale)
  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  const previewCookie = (await cookies()).get('__preview')?.value
  try {
    d1Page = await getPageByType('PRICING', locale, previewCookie)
  } catch { /* D1 unavailable */ }

  return (
    <>
      <JsonLd schema={offerSchema} />
      <TsenyClient d1Sections={d1Page?.sections ?? []} />
    </>
  )
}
