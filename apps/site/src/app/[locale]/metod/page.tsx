import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import MetodClient from './client-page'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.metod' })

  return seoMetadata({
    title: t('heading'),
    description: t('heroSubtitle'),
    path: '/metod',
    locale,
  })
}

export default function MetodPage() {
  return <MetodClient />
}
