import { notFound } from 'next/navigation'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate } from '@/lib/content'
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
  const post = getBlogPost(slug, locale)
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
    locale,
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params
  const post = getBlogPost(slug, locale)
  if (!post) notFound()

  /* ── Related posts from same category (excluding current) ── */
  const allPosts = getAllBlogPosts(locale)
  const relatedPosts = allPosts
    .filter(p => p.categorySlug === post.categorySlug && p.slug !== slug)
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
