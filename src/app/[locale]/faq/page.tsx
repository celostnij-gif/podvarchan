import { getTranslations, getMessages } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { faqSchema } from '@/lib/schema'
import { getPublishedFaq } from '@/lib/content'
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

/* ── Try to fetch FAQ from D1, fall back to messages ── */

async function getFaqItems(locale: string): Promise<FAQItem[]> {
  try {
    const fromDb = await getPublishedFaq(locale)
    if (fromDb && fromDb.length > 0) {
      return fromDb.map((item) => ({
        question: item.translation.question,
        answer: item.translation.answer,
      }))
    }
  } catch {
    // D1 not available, fall through to messages
  }

  // Fallback to messages
  const messages = await getMessages({ locale })
  return (messages.faqData as FAQItem[]) ?? []
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const faqItems = await getFaqItems(locale)

  const schema = faqSchema(faqItems)

  return <ClientFaqPage items={faqItems} schemas={[schema]} />
}
