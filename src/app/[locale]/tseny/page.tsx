import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { SITE, AUTHOR } from '@/constants'
import { TsenyClient } from './client-page'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'tseny' })

  return seoMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['цена гипнотерапии', 'стоимость сессии гипноза', 'гипнотерапия онлайн цена', 'сколько стоит гипнотерапия'],
    path: '/tseny',
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
  const t = await getTranslations({ locale, namespace: 'tseny' })
  const offerSchema = await getOfferSchema(locale)

  return <TsenyClient schemas={[offerSchema]} />
}
