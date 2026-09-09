import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType, getPageSeoMeta, getContactChannels } from '@/lib/db/public'
import { breadcrumbSchema } from '@/lib/schema'
import { cookies } from 'next/headers'
import KontaktyClient from './client-page'
import { GeoBlock } from '@/components/seo/geo-block'
export const revalidate = 604800

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contacts' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('CONTACTS', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? (t.has('metaTitle') ? t('metaTitle') : t('pageTitle')),
    description: seo?.description ?? t('pageDescription'),
    path: '/kontakty',
    locale,
  })
}


export default async function KontaktyPage({
  params,
}: Props) {
  const { locale } = await params
  const previewCookie = (await cookies()).get('__preview')?.value

  let d1Channels: Awaited<ReturnType<typeof getContactChannels>> = []
  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  try {
    ;[d1Page, d1Channels] = await Promise.all([
      getPageByType('CONTACTS', locale, previewCookie),
      getContactChannels(),
    ])
  } catch { /* D1 unavailable */ }

  const t = await getTranslations({ locale, namespace: 'contacts' })
  const commonT = await getTranslations({ locale, namespace: 'common' })
  const heroSection = d1Page?.sections?.find((s) => s.key === 'hero' && s.type === 'hero')
  let heroTitle = t('pageTitle')
  if (heroSection?.contentJson) {
    try {
      const parsed = JSON.parse(heroSection.contentJson)
      if (parsed.title) heroTitle = parsed.title
    } catch { /* fallback to messages */ }
  }
  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: heroTitle, href: '/kontakty/' },
  ]
  const breadcrumb = breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumb]} />
      <KontaktyClient d1Channels={d1Channels} d1Sections={d1Page?.sections ?? []} breadcrumbs={breadcrumbs} />
      <GeoBlock
        title={locale === 'uk' ? 'Як записатися на консультацію' : 'Как записаться на консультацию'}
        text={locale === 'uk'
          ? 'Запис займає одну відповідь у месенджері: напишіть у Telegram або WhatsApp — узгодимо зручний час, а перед першою сесією безкоштовно розберемо ваш запит 15 хвилин. Онлайн-формат працює з будь-якого міста: потрібні лише стабільний інтернет і навушники. Якщо не знаєте, який канал обрати, використовуйте форму на цій сторінці — відповідь надходить на email.'
          : 'Запись занимает одно сообщение в мессенджере: напишите в Telegram или WhatsApp — согласуем удобное время, а перед первой сессией бесплатно разберём ваш запрос 15 минут. Онлайн-формат работает из любого города: нужны только стабильный интернет и наушники. Если не знаете, какой канал выбрать, используйте форму на этой странице — ответ придёт на email.'}
      />
    </>
  )
}
