import { getTranslations, getMessages } from 'next-intl/server'
import { cookies } from 'next/headers'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'

import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { faqSchema } from '@/lib/schema'
import { getFAQs, getPageSeoMeta } from '@/lib/db/public'
import { ClientFaqPage } from './client-page'
import type { FAQItem } from '@/types'
export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'faq' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('FAQ', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
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

  return (
    <>
      <GlobalJsonLd locale={(await _params).locale} />
      <ClientFaqPage items={faqItems} schemas={[schema]} />
    </>
  )
}
