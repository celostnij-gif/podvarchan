import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { SERVICES } from '@/constants'
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
  return SERVICES.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServicesMessage[])
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
