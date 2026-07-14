import { notFound } from 'next/navigation'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate } from '@/lib/content'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/db/public'
import { articleSchema, faqSchema } from '@/lib/schema'
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
      relatedPosts: { slug: string; title: string }[]
      jsonLd: Record<string, unknown>
      additionalSchemas?: Record<string, unknown>[]
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

      const schemas: Record<string, unknown>[] = []

      const jsonLd = articleSchema({
        headline: post.title ?? '',
        description: post.excerpt ?? '',
        url: `/blog/${slug}/`,
        datePublished: post.publishedAt ?? new Date().toISOString(),
        dateModified: post.updatedAt ?? post.publishedAt ?? new Date().toISOString(),
        authorName: '',
        locale,
      })
      schemas.push(jsonLd)

      // Add FAQPage schema if faqJson is available
      if (post.faqJson) {
        try {
          const parsedFaq = JSON.parse(post.faqJson)
          if (Array.isArray(parsedFaq) && parsedFaq.length > 0) {
            schemas.push(faqSchema(parsedFaq))
          }
        } catch { /* faqJson parse error — skip */ }
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
        relatedPosts,
        jsonLd,
        additionalSchemas: schemas.slice(1),
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
    const allSchemas = [data.jsonLd, ...(data.additionalSchemas ?? [])]
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
        locale={locale}
        relatedPosts={data.relatedPosts}
        schemas={allSchemas}
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
