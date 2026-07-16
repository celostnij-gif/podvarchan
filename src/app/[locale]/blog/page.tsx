import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPosts, getBlogCategories } from '@/lib/db/public'
import BlogClient from './page-client'
import type { BlogPostPublic, BlogCategoryPublic } from '@/lib/db/public'
import type { BlogPostItem, BlogCategoryItem } from './page-client'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })

  return seoMetadata({
    title: t('pageTitle'),
    description: t('pageDescription'),
    path: '/blog',
    locale,
  })
}

function mapPost(p: BlogPostPublic): BlogPostItem {
  return {
    slug: p.slug,
    title: p.title ?? '',
    description: p.excerpt ?? '',
    categorySlug: p.categorySlug ?? '',
    categoryName: p.categoryName ?? '',
    datePublished: p.publishedAt ?? '',
    readingTime: p.readingMinutes ?? 5,
    image: p.coverImageId ?? undefined,
    imageAlt: p.title ?? undefined,
  }
}

function mapCategory(c: BlogCategoryPublic): BlogCategoryItem {
  return {
    slug: c.slug,
    name: c.name ?? '',
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  let posts: BlogPostItem[] = []
  let categories: BlogCategoryItem[] = []

  try {
    const [d1Posts, d1Categories] = await Promise.all([
      getBlogPosts(locale),
      getBlogCategories(locale),
    ])
    posts = d1Posts.map(mapPost)
    categories = d1Categories.map(mapCategory)
  } catch {
    // D1 unavailable — fallback to empty, client shows empty state
  }

  return <BlogClient posts={posts} categories={categories} />
}
