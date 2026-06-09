import { notFound } from 'next/navigation'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate, getBlogPostBySlug } from '@/lib/content'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDb } from '@/db'
import { eq, and } from 'drizzle-orm'
import * as s from '@/db/schema'
import { articleSchema } from '@/lib/schema'
import { ClientBlogPost } from './client-page'

export const dynamicParams = false

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  const post = getBlogPost(slug)
  if (!post) return {}

  return seoMetadata({
    title: post.title,
    description: post.metaDescription,
    keywords: post.keywords,
    path: `/blog/${slug}`,
    type: 'article',
    ogImage: post.image,
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
    author: post.author,
    articleTags: post.keywords,
    articleSection: post.categoryName,
    locale,
  })
}

/* ── Helper: resolve category info from D1 ── */

async function getCategoryInfoFromDb(categoryId: string, locale: string): Promise<{ name: string; slug: string } | null> {
  try {
    const ctx = getCloudflareContext()
    const binding = (ctx.env as unknown as Record<string, unknown>).DB as D1Database | undefined
    if (!binding) return null

    const db = getDb(binding)
    const [catTrans] = await db
      .select()
      .from(s.blogCategoryTranslations)
      .where(and(
        eq(s.blogCategoryTranslations.categoryId, categoryId),
        eq(s.blogCategoryTranslations.locale, locale as 'ru' | 'uk'),
      ))
      .limit(1)

    if (!catTrans) return null
    return { name: catTrans.name, slug: catTrans.slug }
  } catch {
    return null
  }
}

/* ── Try to fetch blog post from D1, fall back to static data ── */

async function getPostData(slug: string, locale: string) {
  // Try D1 first (only available at runtime on Cloudflare)
  try {
    const fromDb = await getBlogPostBySlug(slug, locale)
    if (fromDb && fromDb.translation) {
      const t = fromDb.translation
      // Convert TipTap JSON to HTML for rendering
      const contentHtml = t.contentHtml ?? ''
      const contentJson = t.contentJson ?? '{}'

      // Resolve image from static content (blog images are static files)
      const staticPost = getBlogPost(slug)
      const image = staticPost?.image ?? ''
      const imageAlt = staticPost?.imageAlt ?? ''

      // Resolve category name and slug from D1
      let categoryName = ''
      let categorySlug = ''
      if (fromDb.categoryId) {
        const categoryData = await getCategoryInfoFromDb(fromDb.categoryId, locale)
        categoryName = categoryData?.name ?? ''
        categorySlug = categoryData?.slug ?? ''
      }

      return {
        title: t.title,
        body: contentHtml || contentJson,
        description: t.excerpt ?? '',
        author: '',
        datePublished: fromDb.publishedAt?.toISOString() ?? '',
        dateModified: fromDb.updatedAt?.toISOString() ?? '',
        image,
        imageAlt,
        readingTime: fromDb.readingMinutes,
        categoryName,
        categorySlug,
        keywords: [] as string[],
        metaDescription: t.excerpt ?? '',
      }
    }
  } catch {
    // D1 not available, fall through to static
  }

  // Fallback to static data
  const post = getBlogPost(slug)
  if (!post) return null

  return post
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params
  const post = await getPostData(slug, locale)
  if (!post) notFound()

  /* ── Related posts from same category (excluding current) ── */
  const allPosts = getAllBlogPosts()
  const relatedPosts = allPosts
    .filter(p => p.categorySlug === (post as typeof allPosts[number]).categorySlug && p.slug !== slug)
    .slice(0, 2)
    .map(p => ({ slug: p.slug, title: p.title }))

  const jsonLd = articleSchema({
    headline: post.title,
    description: post.description,
    url: `/blog/${slug}/`,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    image: post.image,
    imageAlt: post.imageAlt,
    imageCaption: post.title,
    authorName: post.author,
    locale,
  })

  return (
    <ClientBlogPost
      title={post.title}
      body={post.body ?? ''}
      date={formatDate(post.datePublished)}
      category={post.categoryName}
      categorySlug={post.categorySlug}
      author={post.author}
      readingTime={post.readingTime}
      slug={slug}
      image={post.image}
      imageAlt={post.imageAlt}
      locale={locale}
      relatedPosts={relatedPosts}
      schemas={[jsonLd]}
    />
  )
}
