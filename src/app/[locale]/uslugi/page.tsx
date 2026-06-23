import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { UslugiClient } from './page-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    keywords: [
      'гипнотерапия онлайн',
      'услуги гипнотерапевта',
      'работа с тревогой',
      'гипноз онлайн',
      'психологическая помощь онлайн',
    ],
    path: '/uslugi',
    locale,
  })
}

export default async function UslugiPage() {
  return <UslugiClient />
}
