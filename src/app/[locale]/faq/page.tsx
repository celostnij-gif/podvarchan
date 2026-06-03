import { getTranslations, getMessages } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { faqSchema } from '@/lib/schema'
import { ClientFaqPage } from './client-page'
import type { FAQItem } from '@/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'faq' })

  return seoMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/faq',
    keywords: ['гипнотерапия вопросы', 'онлайн гипноз безопасность', 'сколько сессий гипноза', 'FAQ гипнотерапевт'],
    locale,
  })
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const faqItems = (messages.faqData as FAQItem[]) ?? []

  const schema = faqSchema(faqItems)

  return <ClientFaqPage items={faqItems} schemas={[schema]} />
}
