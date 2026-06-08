import { notFound } from 'next/navigation'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate, getBlogPostBySlug } from '@/lib/content'
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

      return {
        title: t.title,
        body: contentHtml || contentJson,
        description: t.excerpt ?? '',
        author: '',
        datePublished: fromDb.publishedAt?.toISOString() ?? '',
        dateModified: fromDb.updatedAt?.toISOString() ?? '',
        image: '',
        imageAlt: '',
        readingTime: fromDb.readingMinutes,
        categoryName: '',
        categorySlug: '',
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
