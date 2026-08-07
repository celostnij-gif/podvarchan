import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { cookies } from 'next/headers'
import { getPageSeoMeta } from '@/lib/db/public'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { MetadataPage } from '@/components/seo/metadata-page'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'disclaimer' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('DISCLAIMER', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
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
    <>
      <GlobalJsonLd locale={locale} />
      <MetadataPage title={t('pageTitle')}
      content={t('content')}
      breadcrumbItems={[
        { label: commonT('nav.home'), href: '/' },
        { label: t('pageTitle') },
      ]}
      clean />
    </>
  )
}
