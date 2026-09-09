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
  const t = await getTranslations({ locale, namespace: 'disclaimer' })
  const previewCookie = (await cookies()).get('__preview')?.value
  const seo = await getPageSeoMeta('DISCLAIMER', locale, previewCookie).catch(() => null)

  return seoMetadata({
    title: seo?.title ?? t('metaTitle'),
    description: seo?.description ?? t('metaDescription'),
    path: '/disclaimer',
    locale,
  })
}

export default async function DisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'disclaimer' })
  const commonT = await getTranslations({ locale, namespace: 'common' })

  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: t('pageTitle'), href: '/disclaimer/' },
  ]

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })]} />
      <GeoBlock
        title={locale === 'uk' ? 'Коротко про дисклеймер' : 'Коротко о дисклеймере'}
        text={locale === 'uk'
          ? 'Матеріали сайту мають освітній характер і не замінюють психіатричну чи психотерапевтичну допомогу за медичними показаннями. Гіпнотерапія не призначає і не скасовує ліки — рішення про медичне лікування залишається за лікарем. Якщо потрібна саме медична допомога, зверніться до профільного спеціаліста; гіпнотерапія може супроводжувати таку роботу як допоміжна практика.'
          : 'Материалы сайта носят образовательный характер и не заменяют психиатрическую или психотерапевтическую помощь по медицинским показаниям. Гипнотерапия не назначает и не отменяет лекарства — решение о медицинском лечении остаётся за врачом. Если нужна именно медицинская помощь, обратитесь к профильному специалисту; гипнотерапия может сопровождать такую работу как вспомогательная практика.'}
      />
      <MetadataPage title={t('pageTitle')}
      content={t('content')}
      breadcrumbItems={breadcrumbs}
      clean />
    </>
  )
}
