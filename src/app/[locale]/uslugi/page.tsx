import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getServices } from '@/lib/db/public'
import { UslugiClient } from './page-client'
import type { ServicePublic } from '@/lib/db/public'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/uslugi',
    locale,
  })
}

interface ServiceItem {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
}

function mapServiceToItem(svc: ServicePublic): ServiceItem {
  return {
    slug: svc.slug,
    title: svc.title,
    shortTitle: svc.shortTitle ?? '',
    description: svc.description ?? '',
    metaDescription: svc.description ?? '',
    keywords: [],
    cta: svc.ctaText ?? '',
  }
}

export default async function UslugiPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let services: ServiceItem[] = []

  try {
    const d1Services = await getServices(locale)
    services = d1Services.map(mapServiceToItem)
  } catch {
    // D1 unavailable — client will show empty state (fallback via messages in future)
  }

  return <UslugiClient services={services} />
}
