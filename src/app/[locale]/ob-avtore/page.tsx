import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType } from '@/lib/db/public'
import { ClientAboutPage } from './client-page'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  return seoMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/ob-avtore',
    keywords: ['гипнотерапевт онлайн', 'Вячеслав Подварчан', 'гипнотерапия', 'психолог гипнотерапевт'],
    locale,
  })
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  try {
    d1Page = await getPageByType('ABOUT', locale)
  } catch { /* D1 unavailable */ }

  return <ClientAboutPage d1Sections={d1Page?.sections ?? []} />
}
