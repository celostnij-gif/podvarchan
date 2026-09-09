import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { cookies } from 'next/headers'
import { getPageSeoMeta } from '@/lib/db/public'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema } from '@/lib/schema'
import { MetadataPage } from '@/components/seo/metadata-page'
import { GeoBlock } from '@/components/seo/geo-block'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('PRIVACY', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
    path: '/politika-konfidentsialnosti',
    locale,
  })
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const commonT = await getTranslations({ locale, namespace: 'common' })

  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: t('pageTitle'), href: '/politika-konfidentsialnosti/' },
  ]

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })]} />
      <MetadataPage title={t('pageTitle')}
      content={t('content')}
      breadcrumbItems={breadcrumbs}
      clean />
      {/* GeoBlock after MetadataPage: PageHero renders the page h1 — it must
          come first in the DOM or heading hierarchy reads h0->h2 (§5). */}
      <GeoBlock
        title={locale === 'uk' ? 'Коротко про політику конфіденційності' : 'Коротко о политике конфиденциальности'}
        text={locale === 'uk'
          ? 'Сайт збирає лише мінімально необхідні дані: контакт, який ви самі залишаєте при записі, та знеособлену статистику відвідувань для коректної роботи сервісу. Ми не продаємо і не передаємо особисті дані третім особам, листування в месенджерах залишається конфіденційним, а аналітика не пов\'язує відвідування з особою. Повний текст політики нижче пояснює кожен пункт детально.'
          : 'Сайт собирает только минимально необходимые данные: контакт, который вы сами оставляете при записи, и обезличенную статистику посещений для корректной работы сервиса. Мы не продаём и не передаём личные данные третьим лицам, переписка в мессенджерах остаётся конфиденциальной, а аналитика не связывает посещения с личностью. Полный текст политики ниже раскрывает каждый пункт детально.'}
      />

    </>
  )
}
