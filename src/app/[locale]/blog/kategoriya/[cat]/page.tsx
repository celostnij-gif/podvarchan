import { notFound } from 'next/navigation'
import { getTranslations, getMessages } from 'next-intl/server'
import { BLOG_CATEGORIES } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getPublishedBlogPosts } from '@/lib/content'
import { ClientBlogCategory } from './client-page'
import type { BlogPost } from '@/types'

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

/* ── Try to fetch posts from D1, fall back to static ── */

async function getCategoryPosts(categorySlug: string, locale: string): Promise<BlogPost[]> {
  try {
    const fromDb = await getPublishedBlogPosts(locale)
    if (fromDb && fromDb.length > 0) {
      return fromDb
        .filter(p => p.categoryName !== null)
        .map(p => ({
          slug: p.translation.slug,
          title: p.translation.title,
          description: p.translation.excerpt ?? '',
          metaDescription: '',
          keywords: [] as string[],
          categoryName: p.categoryName ?? '',
          categorySlug: categorySlug,
          datePublished: p.publishedAt?.toISOString() ?? '',
          dateModified: p.updatedAt?.toISOString() ?? '',
          author: '',
          readingTime: p.readingMinutes,
          image: undefined,
          imageAlt: undefined,
        }))
    }
  } catch {
    // D1 not available, fall through
  }

  // Fallback to static data
  const { getBlogPostsByCategory } = await import('@/lib/content')
  const posts = getBlogPostsByCategory(categorySlug)
  return posts.map(p => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    metaDescription: p.metaDescription,
    keywords: p.keywords,
    categoryName: p.categoryName,
    categorySlug: p.categorySlug,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    author: p.author,
    readingTime: p.readingTime,
    image: p.image,
    imageAlt: p.imageAlt,
  }))
}

interface Props {
  params: Promise<{ cat: string; locale: string }>
}

export default async function BlogCategoryPage({ params }: Props) {
  const { cat, locale } = await params
  const messages = await getMessages({ locale })
  const blogCategories = (messages.blogCategories as BlogCategoryMsg[])
  const category = blogCategories.find((c) => c.slug === cat)
  if (!category) notFound()

  const posts = await getCategoryPosts(cat, locale)

  return <ClientBlogCategory category={category} posts={posts} locale={locale} />
}
