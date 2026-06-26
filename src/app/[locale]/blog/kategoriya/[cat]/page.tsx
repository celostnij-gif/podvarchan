import { notFound } from 'next/navigation'
import { getTranslations, getMessages } from 'next-intl/server'
import { BLOG_CATEGORIES } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPostMetasByCategory } from '@/lib/content-metas'
import { ClientBlogCategory } from './client-page'


export const dynamicParams = false
/* ── Local type for blog category data from messages ── */
interface BlogCategoryMsg {
  slug: string
  name: string
  description: string
  metaDescription: string
  keywords: string[]
  serviceSlug?: string
}

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((cat) => ({ cat: cat.slug }))
}

interface Props {
  params: Promise<{ cat: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { cat, locale } = await params
  const messages = await getMessages({ locale })
  const blogCategories = (messages.blogCategories as BlogCategoryMsg[])
  const category = blogCategories.find((c) => c.slug === cat)
  if (!category) return {}
  const t = await getTranslations({ locale, namespace: 'blog' })

  return seoMetadata({
    title: `${category.name} — ${t('pageTitle')}`,
    description: category.metaDescription,
    keywords: category.keywords,
    path: `/blog/kategoriya/${cat}`,
    locale,
  })
}

export default async function BlogCategoryPage({ params }: Props) {
  const { cat, locale } = await params
  const messages = await getMessages({ locale })
  const blogCategories = (messages.blogCategories as BlogCategoryMsg[])
  const category = blogCategories.find((c) => c.slug === cat)
  if (!category) notFound()

  const posts = getBlogPostMetasByCategory(cat, locale)

  return <ClientBlogCategory category={category} posts={posts} locale={locale} />
}
