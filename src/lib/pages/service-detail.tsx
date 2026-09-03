import { notFound, permanentRedirect } from 'next/navigation'
import { getMessages, getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { cookies } from 'next/headers'
import { SERVICES } from '@/constants'
import { SERVICE_SLUG_UK, resolveServiceSlug } from '@/lib/slugMapping'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { serviceSchema, faqSchema, speakableSchema, breadcrumbSchema } from '@/lib/schema'
import { getServiceBySlug, getServiceSlugsById, getServiceSidebar, getSEOMeta, resolvePublishedServiceSlug } from '@/lib/db/public'
import type { ServiceSidebarItem } from '@/lib/db/public'
import { ClientServicePage } from '@/app/[locale]/uslugi/[slug]/client-page'

interface ServiceBreadcrumbItem {
  label: string
  href: string
}

async function buildBreadcrumbs({
  locale,
  catalog,
  serviceSlug,
  serviceLabel,
}: {
  locale: string
  catalog: ServiceCatalog
  serviceSlug: string
  serviceLabel: string
}): Promise<ServiceBreadcrumbItem[]> {
  const commonT = await getTranslations({ locale, namespace: 'common' })
  return [
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.services'), href: catalog === 'poslugy' ? '/poslugy/' : '/uslugi/' },
    { label: serviceLabel, href: `/${catalog}/${serviceSlug}/` },
  ]
}

/**
 * Shared service-detail page + metadata for BOTH service catalogs.
 *
 * RU canonical catalog is `/uslugi/…`; the UK canonical catalog is
 * `/poslugy/…` (ukPath mapping, see AGENTS.md §5). The `catalog` prop
 * selects the segment the CURRENT route renders under; cross-locale URLs
 * are always canonical: RU → /uslugi/, UK → /poslugy/.
 */
export type ServiceCatalog = 'uslugi' | 'poslugy'

export interface ServiceDetailProps {
  params: Promise<{ slug: string; locale: string }>
  catalog: ServiceCatalog
}

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

// ─── SSG: slugs from constants (build-time safe) ───

export async function generateServiceStaticParams(): Promise<{ slug: string }[]> {
  const ruSlugs = SERVICES.map((service) => ({ slug: service.slug }))
  const ukSlugs = SERVICES.map((service) => ({ slug: SERVICE_SLUG_UK[service.slug] })).filter(
    (s) => s.slug !== undefined,
  )
  return [...ruSlugs, ...ukSlugs]
}

// ─── Metadata ───

export async function generateServiceDetailMetadata({ params, catalog }: ServiceDetailProps) {
  const { slug: rawSlug, locale } = await params
  if (catalog === 'poslugy' && locale !== 'uk') notFound()
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
      // Light 2-column lookup — metadata needs only the sibling slugs, not the
      // full sibling service payload (see getServiceSlugsById).
      const siblingSlugs = await getServiceSlugsById(svc.id).catch(() => null)
      const ukSlug = siblingSlugs?.uk ?? SERVICE_SLUG_UK[resolvedSlug]
      const ukPath = ukSlug ? `/poslugy/${ukSlug}` : undefined
      const ruPathSlug = siblingSlugs?.ru ?? resolvedSlug
      return seoMetadata({
        title,
        description,
        keywords: seo?.keywords ? seo.keywords.split(',').map((k: string) => k.trim()) : undefined,
        path: `/${catalog}/${displaySlug}`,
        ruPath: `/uslugi/${ruPathSlug}`,
        ukPath,
        type: 'service',
        locale,
        modifiedTime: svc.updatedAt ?? undefined,
      })
    }
  } catch { /* fallback to messages */ }

  // Fallback to messages — use resolved (RU) slug for messages lookup
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
  const svc = servicesData.find((s) => s.slug === resolvedSlug)
  if (!svc) return {}

  const ukSlug = SERVICE_SLUG_UK[resolvedSlug]
  const ukPath = ukSlug ? `/poslugy/${ukSlug}` : undefined

  return seoMetadata({
    title: svc.title,
    description: svc.metaDescription,
    path: `/${catalog}/${resolvedSlug}`,
    ruPath: `/uslugi/${resolvedSlug}`,
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
  let service = servicesData.find((s) => s.slug === slug)
  if (!service) {
    // UK alias differs from RU — try reverse mapping (S1 fix)
    const ruSlug = resolveServiceSlug(slug)
    if (ruSlug !== slug) {
      service = servicesData.find((s) => s.slug === ruSlug)
    }
  }
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

export async function ServiceDetailPage({ params, catalog }: ServiceDetailProps) {
  const { slug: rawSlug, locale } = await params
  if (catalog === 'poslugy' && locale !== 'uk') notFound()
  // For UK locale, use the raw slug directly (it's the correct DB slug for UK locale).
  // For RU locale, resolveServiceSlug is a no-op (already RU slug).
  const slug = locale === 'uk' ? rawSlug : resolveServiceSlug(rawSlug)
  const data = await loadService(slug, locale)
  if (!data) {
    // Cross-locale slug swap (lang switcher swaps only the locale prefix):
    // 301 to the paired slug of the SAME service in the requested locale; if
    // untranslated, fall back to the locale where it exists.
    const resolved = await resolvePublishedServiceSlug(slug).catch(() => null)
    if (resolved) {
      const loc = (locale === 'uk' ? 'uk' : 'ru') as 'ru' | 'uk'
      const other: 'ru' | 'uk' = loc === 'uk' ? 'ru' : 'uk'
      const section = (l: 'ru' | 'uk') => (l === 'uk' ? 'poslugy' : 'uslugi')
      const current = `/${locale}/${catalog}/${rawSlug}/`
      if (resolved[loc]) {
        const target = `/${loc}/${section(loc)}/${resolved[loc]}/`
        if (target !== current) permanentRedirect(target)
      }
      if (resolved[other]) {
        const target = `/${other}/${section(other)}/${resolved[other]}/`
        if (target !== current) permanentRedirect(target)
      }
    }
    notFound()
  }

  if (data.type === 'd1') {
    const schema = serviceSchema({
      name: data.title,
      description: data.description,
      url: `/${catalog}/${data.slug}/`,
      locale,
    })
    const schemas: Record<string, unknown>[] = [schema]
    schemas.push(speakableSchema('.section-card-body p, .subsection-body p'))

    if (data.faqJson) {
      try {
        const parsed = JSON.parse(data.faqJson)
        if (Array.isArray(parsed) && parsed.length > 0) {
          schemas.push(faqSchema(parsed as ServiceFaqEntry[]))
        }
      } catch { /* faqJson optional */ }
    }

    const breadcrumbs = await buildBreadcrumbs({ locale, catalog, serviceSlug: data.slug, serviceLabel: data.shortTitle || data.title })
    schemas.push(breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale }))

    return (
      <>
        <GlobalJsonLd locale={locale} />
        <PageJsonLd schemas={schemas} />
        <ClientServicePage service={data} locale={locale} breadcrumbs={breadcrumbs} />
      </>
    )
  }

  const { service, faqs, allServices } = data
  const schema = serviceSchema({
    name: service.title,
    description: service.description,
    url: `/${catalog}/${service.slug}/`,
    locale,
  })

  const schemas: Record<string, unknown>[] = [schema]
  schemas.push(speakableSchema('.section-card-body p, .subsection-body p'))
  schemas.push(faqSchema(faqs))

  const breadcrumbs = await buildBreadcrumbs({ locale, catalog, serviceSlug: service.slug, serviceLabel: service.shortTitle || service.title })
  schemas.push(breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale }))

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={schemas} />
      <ClientServicePage service={service} locale={locale} breadcrumbs={breadcrumbs} allServices={allServices} />
    </>
  )
}
