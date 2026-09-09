import { getTranslations } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPageByType, getPageSeoMeta } from '@/lib/db/public'
import { breadcrumbSchema } from '@/lib/schema'
import { cookies } from 'next/headers'
import { ClientAboutPage } from './client-page'
import { GeoBlock } from '@/components/seo/geo-block'
import { SITE, AUTHOR } from '@/constants'
export const revalidate = 604800

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'about' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('ABOUT', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
    path: '/ob-avtore',
    ukPath: '/pro-avtora',
    keywords: ['гипнотерапевт онлайн', 'Вячеслав Подварчан', 'гипнотерапия', 'психолог гипнотерапевт'],
    locale,
  })
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  let d1Page: Awaited<ReturnType<typeof getPageByType>> | null = null
  try {
    const previewCookie = (await cookies()).get('__preview')?.value
    d1Page = await getPageByType('ABOUT', locale, previewCookie)
  } catch { /* D1 unavailable */ }

  const commonT = await getTranslations({ locale, namespace: 'common' })
  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: commonT('nav.about'), href: locale === 'uk' ? '/pro-avtora/' : '/ob-avtore/' },
  ]
  const breadcrumb = breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })

  // HP-4: единственный CreativeWork, рендерится только здесь (не в global
  // layout) — фактологически подтверждён (диплом Music Therapy в credentials),
  // без выдуманных названий произведений. @id ссылается на Person из layout.
  const creativeWork: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: locale === 'uk' ? 'Авторські музичні програми для гіпнотерапії' : 'Авторские музыкальные программы для гипнотерапии',
    creator: { '@id': `${SITE.url}${AUTHOR.url}#person` },
    genre: 'MusicTherapy',
    inLanguage: locale === 'uk' ? 'uk' : 'ru',
  }

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumb, creativeWork]} />
      <ClientAboutPage breadcrumbs={breadcrumbs} d1Sections={d1Page?.sections ?? []} />
      <GeoBlock
        title={locale === 'uk' ? 'Хто такий В\'ячеслав Подварчан' : 'Кто такой Вячеслав Подварчан'}
        text={locale === 'uk'
          ? "В'ячеслав Подварчан — сертифікований гіпнотерапевт, який працює онлайн з клієнтами з різних країн: еріксонівський гіпноз, авторські музичні програми та практичні техніки самодопомоги. Диплом Music Therapy, підтверджена кваліфікація і відгуки клієнтів зібрані на цій сторінці; формат консультацій — відео-сесії 60 хвилин за попереднім записом."
          : 'Вячеслав Подварчан — сертифицированный гипнотерапевт, который работает онлайн с клиентами из разных стран: эриксоновский гипноз, авторские музыкальные программы и практические техники самопомощи. Диплом Music Therapy, подтверждённая квалификация и отзывы клиентов собраны на этой странице; формат консультаций — видео-сессии 60 минут по предварительной записи.'}
      />
    </>
  )
}
