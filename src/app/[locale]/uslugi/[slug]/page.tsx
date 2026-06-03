import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { SERVICES } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { serviceSchema } from '@/lib/schema'
import { ClientServicePage } from './client-page'

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as Array<{ slug: string; title: string; metaDescription: string }>)
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
  const servicesData = (messages.servicesData as Array<{ slug: string; title: string; shortTitle: string; description: string; metaDescription: string; keywords: string[]; cta: string }>)
  const service = servicesData.find((s) => s.slug === slug)
  if (!service) notFound()

  const schema = serviceSchema({
    name: service.title,
    description: service.description,
    url: `/uslugi/${service.slug}/`,
    locale,
  })

  return <ClientServicePage service={service} locale={locale} schemas={[schema]} />
}
