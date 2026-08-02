import { getTranslations, getMessages } from 'next-intl/server'
import { getAllBlogPostMetas } from '@/lib/content-metas'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { ClientSearchPage } from './client-page'
import { GlobalSchemas } from '@/components/GlobalSchemas'

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

  return (
    <>
      <GlobalSchemas locale={locale} />
      <ClientSearchPage
        locale={locale}
        blogPosts={blogPosts}
        services={servicesData}
        translations={{
          heading: t('heading'),
          placeholder: t('placeholder'),
          noResults: t('noResults'),
          blogHeading: t('blogHeading'),
          servicesHeading: t('servicesHeading'),
          readingTime: t('readingTime'),
          minutes: t('minutes'),
        }}
      />
    </>
  )
}
