import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { MetadataPage } from '@/components/seo/metadata-page'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'disclaimer' })

  return seoMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/disclaimer',
    locale,
  })
}

export default async function DisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'disclaimer' })
  const commonT = await getTranslations({ locale, namespace: 'common' })

  return (
    <MetadataPage
      title={t('pageTitle')}
      content={t('content')}
      breadcrumbItems={[
        { label: commonT('nav.home'), href: '/' },
        { label: t('pageTitle') },
      ]}
      clean
    />
  )
}
