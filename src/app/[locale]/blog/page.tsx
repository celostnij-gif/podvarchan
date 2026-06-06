import { getPublishedBlogPosts } from '@/lib/content'
import { getAllBlogPostMetas } from '@/lib/content'
import BlogListClient, { type BlogPostMeta } from './blog-list-client'

/* ── Try to fetch from D1, fall back to static ── */

async function getBlogPostsData(locale: string): Promise<BlogPostMeta[]> {
  // Try D1 first (only available at runtime on Cloudflare)
  try {
    const fromDb = await getPublishedBlogPosts(locale)
    if (fromDb && fromDb.length > 0) {
      return fromDb.map((p) => ({
        slug: p.translation.slug,
        title: p.translation.title,
        description: p.translation.excerpt ?? '',
        metaDescription: '',
        keywords: [] as string[],
        categorySlug: '',
        categoryName: p.categoryName ?? '',
        datePublished: p.publishedAt?.toISOString() ?? '',
        dateModified: p.updatedAt?.toISOString() ?? '',
        author: '',
        readingTime: p.readingMinutes,
      }))
    }
  } catch {
    // D1 not available, fall through to static
  }

  // Fallback to static data
  const metas = getAllBlogPostMetas()
  return metas.map((m) => ({
    slug: m.slug,
    title: m.title,
    description: m.description,
    metaDescription: m.metaDescription,
    keywords: m.keywords,
    categorySlug: m.categorySlug,
    categoryName: m.categoryName,
    datePublished: m.datePublished,
    dateModified: m.dateModified,
    author: m.author,
    readingTime: m.readingTime,
    image: m.image,
    imageAlt: m.imageAlt,
  }))
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const posts = await getBlogPostsData(locale)

  return <BlogListClient posts={posts} />
}
