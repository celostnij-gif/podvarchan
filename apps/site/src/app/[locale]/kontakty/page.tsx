import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import KontaktyClient from './client-page'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacts' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/kontakty',
    locale,
  })
}

export default async function KontaktyPage() {
  return <KontaktyClient />
}
