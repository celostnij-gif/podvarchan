import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate } from '@/lib/content'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/db/public'
import { getDB } from '@/db'
import { mediaAssets } from '@/db/schema/media'
import { articleSchema } from '@/lib/schema'
import { ClientBlogPost } from './client-page'
import { BLOG_SLUG_UK, resolveBlogSlug } from '@/lib/slugMapping'

export const revalidate = 3600

interface Props {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateStaticParams() {
  const ruSlugs = getAllBlogSlugs()
  const ukSlugs = ruSlugs.map((s) => BLOG_SLUG_UK[s]).filter(Boolean)
  return [...ruSlugs, ...ukSlugs].map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveBlogSlug(rawSlug)

  try {
    const post = await getBlogPostBySlug(slug, locale)
    if (post) {
      const ukSlug = BLOG_SLUG_UK[slug]
      const ukPath = ukSlug ? `/blog/${ukSlug}` : undefined
      return seoMetadata({
        title: post.title ?? '',
        description: post.excerpt ?? post.title ?? '',
        path: `/blog/${slug}`,
        ukPath,
        type: 'article',
        publishedTime: post.publishedAt ?? undefined,
        modifiedTime: post.updatedAt ?? undefined,
        locale,
      })
    }
  } catch { /* fallback */ }

  const post = getBlogPost(slug, locale)
  if (!post) return {}
  const ukSlug = BLOG_SLUG_UK[slug]
  const ukPath = ukSlug ? `/blog/${ukSlug}` : undefined
  return seoMetadata({
    title: post.title,
    description: post.metaDescription,
    keywords: post.keywords,
    path: `/blog/${slug}`,
    ukPath,
    type: 'article',
    ogImage: post.image,
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
    author: post.author,
    locale,
  })
}

type BlogPageData =
  | {
      type: 'd1'
      title: string
      body: string
      date: string
      category: string
      categorySlug: string
      readingTime: number
      slug: string
      image?: string
      imageAlt?: string
      relatedPosts: { slug: string; title: string }[]
      jsonLd: Record<string, unknown>
    }
  | { type: 'fallback'; post: import('@/types').BlogPost; locale: string; relatedPosts: { slug: string; title: string }[]; jsonLd: Record<string, unknown> }

async function loadBlogPost(slug: string, locale: string): Promise<BlogPageData | null> {
  try {
    const post = await getBlogPostBySlug(slug, locale)
    if (post) {
      const allPosts = await getBlogPosts(locale)
      const relatedPosts = allPosts
        .filter((p) => p.categorySlug === post.categorySlug && p.slug !== slug)
        .slice(0, 4)
        .map((p) => ({ slug: p.slug, title: p.title ?? '' }))

      const jsonLd = articleSchema({
        headline: post.title ?? '',
        description: post.excerpt ?? '',
        url: `/blog/${slug}/`,
        datePublished: post.publishedAt ?? new Date().toISOString(),
        dateModified: post.updatedAt ?? post.publishedAt ?? new Date().toISOString(),
        authorName: '',
        locale,
      })

      // Resolve coverImageId to a displayable URL
      let coverImageUrl: string | null = null
      if (post.coverImageId) {
        if (post.coverImageId.startsWith('/') || post.coverImageId.startsWith('http')) {
          coverImageUrl = post.coverImageId
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(post.coverImageId)) {
          // UUID — resolve from media_assets
          const db = getDB()
          const asset = await db
            .select({ publicUrl: mediaAssets.publicUrl })
            .from(mediaAssets)
            .where(eq(mediaAssets.id, post.coverImageId))
            .get()
          coverImageUrl = asset?.publicUrl ?? null
        }
      }

      // If D1 coverImageId is null/empty, fall back to static blog post image
      if (!coverImageUrl) {
        const staticPost = getBlogPost(slug, locale)
        if (staticPost?.image) {
          coverImageUrl = staticPost.image
        }
      }

      return {
        type: 'd1',
        title: post.title ?? '',
        body: post.contentHtml ?? '',
        date: post.publishedAt ? formatDate(post.publishedAt, locale) : '',
        category: post.categoryName ?? '',
        categorySlug: post.categorySlug ?? '',
        readingTime: post.readingMinutes ?? 5,
        slug,
        image: coverImageUrl || undefined,
        imageAlt: post.title ?? undefined,
        relatedPosts,
        jsonLd,
      }
    }
  } catch { /* fallback */ }

  const post = getBlogPost(slug, locale)
  if (!post) return null

  const allPosts = getAllBlogPosts(locale)
  const relatedPosts = allPosts
    .filter((p) => p.categorySlug === post.categorySlug && p.slug !== slug)
    .slice(0, 4)
    .map((p) => ({ slug: p.slug, title: p.title }))

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

  return { type: 'fallback', post, locale, relatedPosts, jsonLd }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveBlogSlug(rawSlug)
  const data = await loadBlogPost(slug, locale)
  if (!data) notFound()

  if (data.type === 'd1') {
    return (
      <ClientBlogPost
        title={data.title}
        body={data.body}
        date={data.date}
        category={data.category}
        categorySlug={data.categorySlug}
        author=""
        readingTime={data.readingTime}
        slug={data.slug}
        image={data.image}
        imageAlt={data.imageAlt}
        locale={locale}
        relatedPosts={data.relatedPosts}
        schemas={[data.jsonLd]}
      />
    )
  }

  const { post } = data
  return (
    <ClientBlogPost
      title={post.title}
      body={post.body ?? ''}
      date={formatDate(post.datePublished, locale)}
      category={post.categoryName}
      categorySlug={post.categorySlug}
      author={post.author}
      readingTime={post.readingTime}
      slug={slug}
      image={post.image}
      imageAlt={post.imageAlt}
      locale={locale}
      relatedPosts={data.relatedPosts}
      schemas={[data.jsonLd]}
    />
  )
}
