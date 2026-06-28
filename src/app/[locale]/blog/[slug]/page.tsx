import { notFound } from 'next/navigation'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate } from '@/lib/content'
import { articleSchema } from '@/lib/schema'
import { ClientBlogPost } from './client-page'
import { BLOG_SLUG_UK, resolveBlogSlug } from '@/lib/slugMapping'

export const dynamicParams = false

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

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = resolveBlogSlug(rawSlug)
  const post = getBlogPost(slug, locale)
  if (!post) notFound()

  /* ── Related posts from same category (excluding current) ── */
  const allPosts = getAllBlogPosts(locale)
  const relatedPosts = allPosts
    .filter(p => p.categorySlug === post.categorySlug && p.slug !== slug)
    .slice(0, 4)
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
      date={formatDate(post.datePublished, locale)}
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
