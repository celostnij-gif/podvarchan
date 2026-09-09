import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getServiceSidebar } from '@/lib/db/public'
import { breadcrumbSchema } from '@/lib/schema'
import { UslugiClient } from './page-client'
import { GeoBlock } from '@/components/seo/geo-block'
import type { ServiceSidebarItem } from '@/lib/db/public'

export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services' })

  return seoMetadata({
    title: t.has('metaTitle') ? t('metaTitle') : t('pageTitle'),
    description: t('pageDescription'),
    path: '/uslugi',
    ukPath: '/poslugy',
    locale,
  })
}

interface ServiceItem {
  slug: string
  title: string
  shortTitle: string
  description: string
  metaDescription: string
  keywords: string[]
  cta: string
}

function mapServiceToItem(svc: ServiceSidebarItem): ServiceItem {
  return {
    slug: svc.slug,
    title: svc.title,
    shortTitle: svc.shortTitle ?? '',
    description: svc.description ?? '',
    metaDescription: svc.description ?? '',
    keywords: [],
    cta: svc.ctaText ?? '',
  }
}

export default async function UslugiPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let services: ServiceItem[] = []

  try {
    const d1Services = await getServiceSidebar(locale)
    services = d1Services.map(mapServiceToItem)
  } catch {
    // D1 unavailable — client will show empty state (fallback via messages in future)
  }

  const commonT = await getTranslations({ locale, namespace: 'common' })
  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.services'), href: locale === 'uk' ? '/poslugy/' : '/uslugi/' },
  ]
  const breadcrumb = breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumb]} />
      <UslugiClient services={services} breadcrumbs={breadcrumbs} />
      <GeoBlock
        title={locale === 'uk' ? 'Як вибрати напрямок роботи' : 'Как выбрать направление работы'}
        text={locale === 'uk'
          ? 'Кожен напрямок — окрема програма зі зрозумілою структурою: спочатку діагностика запиту, далі серія сесій еріксонівського гіпнозу та закріплення результату. У списку нижче зібрані послуги з описом симптомів і очікуваних змін. Якщо сумніваєтеся, що обрати, почніть із безкоштовної 15-хвилинної консультації — допоможу визначити корінну причину і підберемо формат роботи.'
          : 'Каждое направление — отдельная программа с понятной структурой: сначала диагностика запроса, затем серия сессий эриксоновского гипноза и закрепление результата. В списке ниже собраны услуги с описанием симптомов и ожидаемых изменений. Если сомневаетесь, что выбрать, начните с бесплатной 15-минутной консультации — помогу определить корневую причину и подберём формат работы.'}
      />
    </>
  )
}
