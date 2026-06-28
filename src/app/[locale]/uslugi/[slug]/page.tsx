import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { SERVICES } from '@/constants'
import { SERVICE_SLUG_UK, resolveServiceSlug } from '@/lib/slugMapping'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { serviceSchema, faqSchema } from '@/lib/schema'
import { ClientServicePage } from './client-page'

export const dynamicParams = false

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

export async function generateStaticParams() {
  const ruSlugs = SERVICES.map((service) => ({ slug: service.slug }))
  const ukSlugs = SERVICES.map((service) => ({ slug: SERVICE_SLUG_UK[service.slug] })).filter(
    (s) => s.slug !== undefined
  )
  return [...ruSlugs, ...ukSlugs]
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveServiceSlug(rawSlug)
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
  const service = servicesData.find((s) => s.slug === slug)
  if (!service) return {}

  const ukSlug = SERVICE_SLUG_UK[slug]
  const ukPath = ukSlug ? `/uslugi/${ukSlug}` : undefined

  return seoMetadata({
    title: service.title,
    description: service.metaDescription,
    path: `/uslugi/${slug}`,
    ukPath,
    type: 'service',
    locale,
  })
}

export default async function ServicePage({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveServiceSlug(rawSlug)
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
  const service = servicesData.find((s) => s.slug === slug)
  if (!service) notFound()

  const withFaqs = messages as unknown as MessagesWithFaqs
  const faqs = withFaqs.serviceFaqs?.[slug] ?? []
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

  return <ClientServicePage service={service} locale={locale} schemas={schemas} />
}
