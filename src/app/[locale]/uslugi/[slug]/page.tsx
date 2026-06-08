import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { SERVICES } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { serviceSchema } from '@/lib/schema'
import { getServiceBySlug } from '@/lib/content'
import { ClientServicePage } from './client-page'

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }))
}

/* ── Try to fetch from D1, fall back to messages ── */

interface ServiceData {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
}

async function getServiceData(slug: string, locale: string): Promise<ServiceData | null> {
  // Try D1 first (only available at runtime on Cloudflare)
  try {
    const fromDb = await getServiceBySlug(slug, locale)
    if (fromDb) {
      const t = fromDb.translation
      return {
        slug: t.slug,
        title: t.title,
        shortTitle: t.shortTitle ?? '',
        description: t.description ?? '',
        metaDescription: '',
        keywords: [],
        cta: t.ctaText ?? '',
      }
    }
  } catch {
    // D1 not available, fall through to messages
  }

  // Fallback to messages
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServiceData[]) ?? []
  return servicesData.find((s) => s.slug === slug) ?? null
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServiceData[])
  const service = servicesData.find((s) => s.slug === slug)
  if (!service) return {}

  return seoMetadata({
    title: service.title,
    description: service.metaDescription,
    path: `/uslugi/${slug}`,
    type: 'service',
    locale,
  })
}

export default async function ServicePage({ params }: Props) {
  const { slug, locale } = await params
  const service = await getServiceData(slug, locale)
  if (!service) notFound()

  const schema = serviceSchema({
    name: service.title,
    description: service.description,
    url: `/uslugi/${service.slug}/`,
    locale,
  })

  return <ClientServicePage service={service} locale={locale} schemas={[schema]} />
}
