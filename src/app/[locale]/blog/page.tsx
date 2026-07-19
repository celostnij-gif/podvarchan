import { getTranslations } from 'next-intl/server'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPosts, getBlogCategories, getMediaPublicUrl, getBlogFirstImageUrls } from '@/lib/db/public'
import { getBlogPost } from '@/lib/content'
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

function mapPost(p: BlogPostPublic, image?: string, imageAlt?: string): BlogPostItem {
  return {
    slug: p.slug,
    title: p.title ?? '',
    description: p.excerpt ?? '',
    categorySlug: p.categorySlug ?? '',
    categoryName: p.categoryName ?? '',
    datePublished: p.publishedAt ?? '',
    readingTime: p.readingMinutes ?? 5,
    image: image,
    imageAlt: imageAlt ?? p.title ?? undefined,
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

    // Resolve cover images: D1 media lookup → static content fallback → first body image
    const resolvedPosts = await Promise.all(d1Posts.map(async (p) => {
      let imageUrl: string | undefined
      let imageAlt: string | undefined

      // 1) Try D1 media resolution (coverImageId → public URL)
      if (p.coverImageId) {
        const url = await getMediaPublicUrl(p.coverImageId)
        if (url) {
          imageUrl = url
        }
      }

      // 2) Fallback to static content image (articles in both D1 and static)
      if (!imageUrl) {
        const staticPost = getBlogPost(p.slug, locale)
        if (staticPost?.image) {
          imageUrl = staticPost.image
          imageAlt = staticPost.imageAlt
        }
      }

      return { post: p, imageUrl, imageAlt }
    }))

    // 3) For posts still without image, extract first <img> from article body (one batch query)
    const missing = resolvedPosts.filter(r => !r.imageUrl)
    if (missing.length > 0) {
      const firstImages = await getBlogFirstImageUrls(missing.map(r => r.post.id))
      for (const r of missing) {
        const url = firstImages.get(r.post.id)
        if (url) r.imageUrl = url
      }
    }

    posts = resolvedPosts.map(r => mapPost(r.post, r.imageUrl, r.imageAlt))
    categories = d1Categories.map(mapCategory)
  } catch {
    // D1 unavailable — fallback to empty, client shows empty state
  }

  return <BlogClient posts={posts} categories={categories} />
}
