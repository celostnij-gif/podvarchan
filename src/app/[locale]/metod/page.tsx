import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType } from '@/lib/db/public'
import { cookies } from 'next/headers'
import MetodClient from './client-page'
export const revalidate = 3600

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

export default async function MetodPage({
  params,
}: Props) {
  const { locale } = await params

  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  const previewCookie = (await cookies()).get('__preview')?.value
  try {
    d1Page = await getPageByType('METHOD', locale, previewCookie)
  } catch { /* D1 unavailable */ }

  return <MetodClient d1Sections={d1Page?.sections ?? []} />
}
