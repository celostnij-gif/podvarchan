import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { SERVICES } from '@/constants'
import { SERVICE_SLUG_UK, resolveServiceSlug } from '@/lib/slugMapping'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { serviceSchema, faqSchema } from '@/lib/schema'
import { getServiceBySlug, getServices, getSEOMeta } from '@/lib/db/public'
import { ClientServicePage } from './client-page'

export const revalidate = 3600

interface ServiceFaqEntry {
  question: string
  answer: string
}

interface ServicesMessage {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
}

interface MessagesWithFaqs {
  servicesData: ServicesMessage[]
  serviceFaqs?: Record<string, ServiceFaqEntry[]>
}

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

// ─── SSG: slugs from constants (build-time safe) ───

export async function generateStaticParams() {
  const ruSlugs = SERVICES.map((service) => ({ slug: service.slug }))
  const ukSlugs = SERVICES.map((service) => ({ slug: SERVICE_SLUG_UK[service.slug] })).filter(
    (s) => s.slug !== undefined,
  )
  return [...ruSlugs, ...ukSlugs]
}

// ─── Metadata ───

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveServiceSlug(rawSlug)

  // Try D1 first
  try {
    const svc = await getServiceBySlug(slug, locale)
    if (svc) {
      const seo = svc.id ? await getSEOMeta('service', svc.id, locale) : null
      const title = seo?.title ?? svc.title
      const description = seo?.description ?? svc.description ?? ''
      const ukSlug = SERVICE_SLUG_UK[slug]
      const ukPath = ukSlug ? `/uslugi/${ukSlug}` : undefined
      return seoMetadata({
        title,
        description,
        path: `/uslugi/${slug}`,
        ukPath,
        type: 'service',
        locale,
      })
    }
  } catch { /* fallback to messages */ }

  // Fallback to messages
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
  const svc = servicesData.find((s) => s.slug === slug)
  if (!svc) return {}

  const ukSlug = SERVICE_SLUG_UK[slug]
  const ukPath = ukSlug ? `/uslugi/${ukSlug}` : undefined

  return seoMetadata({
    title: svc.title,
    description: svc.metaDescription,
    path: `/uslugi/${slug}`,
    ukPath,
    type: 'service',
    locale,
  })
}

// ─── Types ───

type ServicePageData =
  | {
      type: 'd1'
      slug: string
      title: string
      shortTitle: string
      description: string
      metaDescription: string
      keywords: string[]
      cta: string
      heroTitle: string | null
      heroSubtitle: string | null
      symptomsJson: string | null
      processJson: string | null
      benefitsJson: string | null
      faqJson: string | null
      icon: string | null
      allServices: Array<{
        slug: string
        title: string
        shortTitle: string
        description: string
        cta: string
      }>
    }
  | {
      type: 'fallback'
      service: ServicesMessage
      locale: string
      faqs: ServiceFaqEntry[]
      allServices: ServicesMessage[]
    }

// ─── Loader ───

async function loadService(slug: string, locale: string): Promise<ServicePageData | null> {
  // Try D1 first
  try {
    const svc = await getServiceBySlug(slug, locale)
    if (svc) {
      const seo = svc.id ? await getSEOMeta('service', svc.id, locale) : null

      let allServices: ServicePageData['allServices'] = []
      try {
        const allSvc = await getServices(locale)
        allServices = allSvc.map((s) => ({
          slug: s.slug,
          title: s.title,
          shortTitle: s.shortTitle ?? '',
          description: s.description ?? '',
          cta: s.ctaText ?? '',
        }))
      } catch {
        // related services best-effort
      }

      return {
        type: 'd1',
        slug: svc.slug,
        title: seo?.title ?? svc.title,
        shortTitle: svc.shortTitle ?? '',
        description: seo?.description ?? svc.description ?? '',
        metaDescription: seo?.description ?? svc.description ?? '',
        keywords: seo?.keywords ? seo.keywords.split(',').map((k: string) => k.trim()) : [],
        cta: svc.ctaText ?? '',
        heroTitle: svc.heroTitle,
        heroSubtitle: svc.heroSubtitle,
        symptomsJson: svc.symptomsJson,
        processJson: svc.processJson,
        benefitsJson: svc.benefitsJson,
        faqJson: svc.faqJson,
        icon: svc.icon,
        allServices,
      }
    }
  } catch { /* fallback */ }

  // Fallback to messages
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
  const service = servicesData.find((s) => s.slug === slug)
  if (!service) return null
  const withFaqs = messages as unknown as MessagesWithFaqs
  const faqs = withFaqs.serviceFaqs?.[slug] ?? []

  return {
    type: 'fallback',
    service,
    locale,
    faqs,
    allServices: servicesData,
  }
}

// ─── Page ───

export default async function ServicePage({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveServiceSlug(rawSlug)
  const data = await loadService(slug, locale)
  if (!data) notFound()

  if (data.type === 'd1') {
    const schema = serviceSchema({
      name: data.title,
      description: data.description,
      url: `/uslugi/${data.slug}/`,
      locale,
    })
    const schemas: Record<string, unknown>[] = [schema]

    if (data.faqJson) {
      try {
        const parsed = JSON.parse(data.faqJson)
        if (Array.isArray(parsed) && parsed.length > 0) {
          schemas.push(faqSchema(parsed as ServiceFaqEntry[]))
        }
      } catch { /* faqJson optional */ }
    }

    return <ClientServicePage service={data} locale={locale} schemas={schemas} />
  }

  const { service, faqs, allServices } = data
  const schema = serviceSchema({
    name: service.title,
    description: service.description,
    url: `/uslugi/${service.slug}/`,
    locale,
  })

  const schemas: Record<string, unknown>[] = [schema]
  if (faqs.length > 0) {
    schemas.push(faqSchema(faqs))
  }

  return <ClientServicePage service={service} locale={locale} schemas={schemas} allServices={allServices} />
}
