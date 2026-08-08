import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import UslugiPage from '../uslugi/page'

export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (locale !== 'uk') notFound()
  const t = await getTranslations({ locale: 'uk', namespace: 'services' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/poslugy',
    ruPath: '/uslugi',
    ukPath: '/poslugy',
    locale: 'uk',
  })
}

export default async function PoslugyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (locale !== 'uk') notFound()
  return <UslugiPage params={params} />
}
