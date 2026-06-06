import { getMessages } from 'next-intl/server'
import { getPublishedServices } from '@/lib/content'
import ServicesListClient, { type ServiceItem } from './services-list-client'

/* ── Try to fetch from D1, fall back to messages ── */

async function getServicesData(locale: string): Promise<ServiceItem[]> {
  // Try D1 first (only available at runtime on Cloudflare)
  try {
    const fromDb = await getPublishedServices(locale)
    if (fromDb && fromDb.length > 0) {
      return fromDb.map((s) => ({
        slug: s.translation.slug,
        title: s.translation.title,
        shortTitle: s.translation.shortTitle ?? '',
        description: s.translation.description ?? '',
        cta: s.translation.ctaText ?? '',
      }))
    }
  } catch {
    // D1 not available, fall through to messages
  }

  // Fallback to messages
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServiceItem[]) ?? []
  return servicesData
}

export default async function UslugiPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const servicesData = await getServicesData(locale)

  return <ServicesListClient servicesData={servicesData} />
}
