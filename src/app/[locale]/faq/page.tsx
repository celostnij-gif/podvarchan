import { getTranslations, getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'

import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { faqSchema } from '@/lib/schema'
import { getFAQs } from '@/lib/db/public'
import { ClientFaqPage } from './client-page'
import type { FAQItem } from '@/types'
export const revalidate = 3600

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
  params: _params,
}: {
  params: Promise<{ locale: string }>
}) {
  // Try D1 first, fallback to messages
  let faqItems: FAQItem[] = []
  const previewCookie = (await cookies()).get('__preview')?.value

  try {
    const d1Items = await getFAQs((await _params).locale, undefined, previewCookie)
    if (d1Items.length > 0) {
      faqItems = d1Items.map((item) => ({
        question: item.question,
        answer: item.answer ?? '',
      }))
    }
  } catch { /* D1 unavailable — fallback to messages */ }

  if (faqItems.length === 0) {
    const messages = await getMessages()
    const data = (messages.faqData as FAQItem[] | undefined)
    if (data && data.length > 0) {
      faqItems = data
    }
  }

  const schema = faqSchema(faqItems)

  return <ClientFaqPage items={faqItems} schemas={[schema]} />
}
