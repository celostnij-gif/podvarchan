import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType, getPageSeoMeta } from '@/lib/db/public'
import { breadcrumbSchema } from '@/lib/schema'
import { cookies } from 'next/headers'
import MetodClient from './client-page'
export const revalidate = 604800

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.metod' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('METHOD', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('heading'),
    description: seo?.description ?? t('heroSubtitle'),
    path: '/metod',
    locale,
  })
}

export default async function MetodPage({
  params,
}: Props) {
  const { locale } = await params

  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  const previewCookie = (await cookies()).get('__preview')?.value
  try {
    d1Page = await getPageByType('METHOD', locale, previewCookie)
  } catch { /* D1 unavailable */ }

  const t = await getTranslations({ locale, namespace: 'pages.metod' })
  const commonT = await getTranslations({ locale, namespace: 'common' })
  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: t('breadcrumb'), href: '/metod/' },
  ]
  const breadcrumb = breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumb]} />
      <MetodClient breadcrumbs={breadcrumbs} d1Sections={d1Page?.sections ?? []} />
    </>
  )
}
