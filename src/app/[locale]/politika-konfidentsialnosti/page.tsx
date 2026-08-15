import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { cookies } from 'next/headers'
import { getPageSeoMeta } from '@/lib/db/public'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema } from '@/lib/schema'
import { MetadataPage } from '@/components/seo/metadata-page'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('PRIVACY', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
    path: '/politika-konfidentsialnosti',
    locale,
  })
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const commonT = await getTranslations({ locale, namespace: 'common' })

  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: t('pageTitle'), href: '/politika-konfidentsialnosti/' },
  ]

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })]} />
      <MetadataPage title={t('pageTitle')}
      content={t('content')}
      breadcrumbItems={breadcrumbs}
      clean />
    </>
  )
}
