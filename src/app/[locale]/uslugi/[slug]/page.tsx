import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import { SERVICES } from '@/constants'
import { SERVICE_SLUG_UK, resolveServiceSlug } from '@/lib/slugMapping'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { serviceSchema, faqSchema } from '@/lib/schema'
import { getServiceBySlug, getServiceSidebar, getSEOMeta } from '@/lib/db/public'
import type { ServiceSidebarItem } from '@/lib/db/public'
import { ClientServicePage } from './client-page'
import { buildTitle } from '@/lib/seo/metadata'

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
  const resolvedSlug = resolveServiceSlug(rawSlug) // canonical RU slug (needed for SERVICE_SLUG_UK mapping)
  const displaySlug = locale === 'uk' ? rawSlug : resolvedSlug // locale-appropriate slug for path
  const previewCookie = (await cookies()).get('__preview')?.value

  // Try D1 first
  try {
    // Use rawSlug for D1 lookup — for UK locale, rawSlug is the UK slug which matches DB
    const svc = await getServiceBySlug(rawSlug, locale, previewCookie)
    if (svc) {
      const seo = svc.id ? await getSEOMeta('service', svc.id, locale) : null
      const title = seo?.title ?? svc.title
      const description = seo?.description ?? svc.description ?? ''
      const ukSlug = SERVICE_SLUG_UK[resolvedSlug]
      const ukPath = ukSlug ? `/uslugi/${ukSlug}` : undefined
      return seoMetadata({
        title,
        description,
        path: `/uslugi/${displaySlug}`,
        ukPath,
        type: 'service',
        locale,
      })
    }
  } catch { /* fallback to messages */ }

  // Fallback to messages — use resolved (RU) slug for messages lookup
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
  const svc = servicesData.find((s) => s.slug === resolvedSlug)
  if (!svc) return {}

  const ukSlug = SERVICE_SLUG_UK[resolvedSlug]
  const ukPath = ukSlug ? `/uslugi/${ukSlug}` : undefined

  return seoMetadata({
    title: svc.title,
    description: svc.metaDescription,
    path: `/uslugi/${resolvedSlug}`,
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
      contentHtml: string | null
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
  const previewCookie = (await cookies()).get('__preview')?.value

  // Try D1 first
  try {
    const svc = await getServiceBySlug(slug, locale, previewCookie)
    if (svc) {
      const [seo, sidebarItems] = await Promise.all([
        svc.id ? getSEOMeta('service', svc.id, locale) : Promise.resolve(null),
        getServiceSidebar(locale).catch(() => [] as ServiceSidebarItem[]),
      ])
      const allServices = sidebarItems.map((s) => ({
        slug: s.slug,
        title: s.title,
        shortTitle: s.shortTitle ?? '',
        description: s.description ?? '',
        cta: s.ctaText ?? '',
      }))
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
        contentHtml: svc.contentHtml,
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
  // For UK locale, use the raw slug directly (it's the correct DB slug for UK locale).
  // For RU locale, resolveServiceSlug is a no-op (already RU slug).
  const slug = locale === 'uk' ? rawSlug : resolveServiceSlug(rawSlug)
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
