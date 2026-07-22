import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType, getContactChannels } from '@/lib/db/public'
import { cookies } from 'next/headers'
import KontaktyClient from './client-page'
export const revalidate = 3600

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

export default async function KontaktyPage({
  params,
}: Props) {
  const { locale } = await params
  const previewCookie = (await cookies()).get('__preview')?.value

  let d1Channels: Awaited<ReturnType<typeof getContactChannels>> = []
  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  try {
    ;[d1Page, d1Channels] = await Promise.all([
      getPageByType('CONTACTS', locale, previewCookie),
      getContactChannels(),
    ])
  } catch { /* D1 unavailable */ }

  return <KontaktyClient d1Channels={d1Channels} d1Sections={d1Page?.sections ?? []} />
}
