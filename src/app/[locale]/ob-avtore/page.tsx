import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType, getSEOMeta } from '@/lib/db/public'
import { cookies } from 'next/headers'
import { ClientAboutPage } from './client-page'
export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })

  let seoTitle = t('metaTitle')
  let seoDescription = t('metaDescription')
  try {
    const previewCookie = (await cookies()).get('__preview')?.value
    const page = await getPageByType('ABOUT', locale, previewCookie)
    if (page?.id) {
      const seo = await getSEOMeta('page', page.id, locale).catch(() => null)
      if (seo?.title) seoTitle = seo.title
      if (seo?.description) seoDescription = seo.description
    }
  } catch { /* D1 unavailable */ }

  return seoMetadata({
    title: seoTitle,
    description: seoDescription,
    path: '/ob-avtore',
    ukPath: '/pro-avtora',
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
    const previewCookie = (await cookies()).get('__preview')?.value
    d1Page = await getPageByType('ABOUT', locale, previewCookie)
  } catch { /* D1 unavailable */ }

  return <ClientAboutPage d1Sections={d1Page?.sections ?? []} />
}
