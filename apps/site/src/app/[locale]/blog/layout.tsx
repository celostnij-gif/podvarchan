import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/blog',
    locale,
  })
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
