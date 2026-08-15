import { getTranslations, getMessages } from 'next-intl/server'
import { GlobalJsonLd } from '@/components/GlobalJsonLd'
import { PageJsonLd } from '@/components/PageJsonLd'
import { getAllBlogPostMetas } from '@/lib/content-metas'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { breadcrumbSchema } from '@/lib/schema'
import { ClientSearchPage } from './client-page'

interface ServiceData {
  slug: string
  title: string
  shortTitle: string
  description: string
  keywords: string[]
}

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'search' })

  const metadata = seoMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: '/search',
    locale,
  })
  return {
    ...metadata,
    robots: { index: false, follow: false },
  }
}

export default async function SearchPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'search' })
  const messages = await getMessages({ locale })
  const servicesData = (messages.servicesData as ServiceData[]) ?? []
  const blogPosts = getAllBlogPostMetas(locale)

  const commonT = await getTranslations({ locale, namespace: 'common' })
  const breadcrumbs = [
    { label: commonT('nav.home'), href: '/' },
    { label: t('breadcrumb'), href: '/search/' },
  ]
  const breadcrumb = breadcrumbSchema({ items: breadcrumbs.map((b) => ({ name: b.label, url: b.href })), locale })

  return (
    <>
      <GlobalJsonLd locale={locale} />
      <PageJsonLd schemas={[breadcrumb]} />
      <ClientSearchPage locale={locale}
      blogPosts={blogPosts}
      services={servicesData}
      breadcrumbs={breadcrumbs}
      translations={{
        heading: t('heading'),
        placeholder: t('placeholder'),
        noResults: t('noResults'),
        blogHeading: t('blogHeading'),
        servicesHeading: t('servicesHeading'),
        readingTime: t('readingTime'),
        minutes: t('minutes'),
      }} />
    </>
  )
}
