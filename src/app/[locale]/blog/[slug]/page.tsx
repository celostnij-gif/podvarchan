import { notFound } from 'next/navigation'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPost, getAllBlogSlugs, getAllBlogPosts, formatDate } from '@/lib/content'
import { getBlogPostBySlug, getBlogPostsByCategory, getMediaWithVariants, getSEOMeta } from '@/lib/db/public'
import type { BlogPostPublic } from '@/lib/db/public'
import { articleSchema, faqSchema, speakableSchema } from '@/lib/schema'
import { ClientBlogPost } from './client-page'
import { BLOG_SLUG_UK, resolveBlogSlug } from '@/lib/slugMapping'
import { COVER_IMAGE_OVERRIDES } from '@/lib/content/cover-images'
import { cookies } from 'next/headers'
import { GlobalSchemas } from '@/components/GlobalSchemas'

/**
 * Определяет, является ли статья клинической (YMYL) для добавления reviewedBy.
 */
function isClinicalArticle(categorySlug: string | null | undefined, slug: string): boolean {
  if (!categorySlug) return false
  const clinicalCategories = new Set(['ptsr', 'trevoga'])
  if (clinicalCategories.has(categorySlug)) return true
  // Также помечаем статьи о панических атаках
  if (slug.includes('panicheskiye-ataki') || slug.includes('panichni-ataki')) return true
  return false
}

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
  const slug = rawSlug

  try {
    const previewCookie = (await cookies()).get('__preview')?.value
    const post = await getBlogPostBySlug(slug, locale, previewCookie)
    if (post) {
      const seo = post.id ? await getSEOMeta('blog_post', post.id, locale).catch(() => null) : null
      const ukSlug = BLOG_SLUG_UK[slug]
      const ukPath = ukSlug ? `/blog/${ukSlug}` : undefined
      // Use locale-specific cover image from override map for og:image
      const resolvedSlug = resolveBlogSlug(slug)
      const overrideCover = COVER_IMAGE_OVERRIDES[resolvedSlug]
      const ogImage = overrideCover?.[locale === 'uk' ? 'uk' : 'ru']
      return seoMetadata({
        title: seo?.title ?? post.title ?? '',
        description: seo?.description ?? post.excerpt ?? post.title ?? '',
        path: `/blog/${slug}`,
        ukPath,
        type: 'article',
        ogImage,
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
      imageVariants?: { width: number; url: string }[]
      relatedPosts: { slug: string; title: string }[]
      jsonLd: Record<string, unknown>
      additionalSchemas?: Record<string, unknown>[]
    }
  | { type: 'fallback'; post: import('@/types').BlogPost; locale: string; relatedPosts: { slug: string; title: string }[]; jsonLd: Record<string, unknown>; fallbackSchemas?: Record<string, unknown>[] }
async function loadBlogPost(slug: string, locale: string): Promise<BlogPageData | null> {
  try {
    const previewCookie = (await cookies()).get('__preview')?.value
    const post = await getBlogPostBySlug(slug, locale, previewCookie)
    if (post) {
      const [inCategory, media] = await Promise.all([
        post.categorySlug ? getBlogPostsByCategory(post.categorySlug, locale) : Promise.resolve([] as BlogPostPublic[]),
        post.coverImageId ? getMediaWithVariants(post.coverImageId) : Promise.resolve(null),
      ])
      const relatedPosts = inCategory
        .filter((p) => p.slug !== slug)
        .slice(0, 4)
        .map((p) => ({ slug: p.slug, title: p.title ?? '' }))

      const clinical = isClinicalArticle(post.categorySlug, slug)

      const schemas: Record<string, unknown>[] = []

      const jsonLd = articleSchema({
        headline: post.title ?? '',
        description: post.excerpt ?? '',
        url: `/blog/${slug}/`,
        datePublished: post.publishedAt ?? new Date().toISOString(),
        dateModified: post.updatedAt ?? post.publishedAt ?? new Date().toISOString(),
        locale,
        category: clinical ? 'clinical' : undefined,
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
      schemas.push(speakableSchema('.blog-content p'))
      // Locale-specific cover image from override map (covers posts with RU/UK variants)
      const resolvedSlug = resolveBlogSlug(slug)
      const override = COVER_IMAGE_OVERRIDES[resolvedSlug]
      let coverImageUrl: string | null = override?.[locale === 'uk' ? 'uk' : 'ru'] ?? null
      let coverImageVariants: { width: number; url: string }[] | undefined

      // Fall back to D1 cover image (shared between locales) if no locale-specific override
      if (!coverImageUrl && media?.url) {
        coverImageUrl = media.url
        coverImageVariants = media?.variants
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
        imageVariants: coverImageVariants,
        relatedPosts,
        jsonLd,
        additionalSchemas: schemas.slice(1), // FAQPage (1+) sans ArticleSchema
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

  const clinical = isClinicalArticle(post.categorySlug, slug)
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
    category: clinical ? 'clinical' : undefined,
  })
  const fallbackSchemas = [speakableSchema('.blog-content p')]

  return { type: 'fallback', post, locale, relatedPosts, jsonLd, fallbackSchemas }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug, locale } = await params
  const slug = rawSlug
  const data = await loadBlogPost(slug, locale)
  if (!data) notFound()

  if (data.type === 'd1') {
    const allSchemas = [data.jsonLd, ...(data.additionalSchemas ?? [])]
    return (
      <>
        <GlobalSchemas locale={locale} />
        {allSchemas.map((s, i) => (
          <script key={`ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
        ))}
        <ClientBlogPost
          title={data.title}
          body={data.body}
          date={data.date}
          category={data.category}
          categorySlug={data.categorySlug}
          readingTime={data.readingTime}
          slug={data.slug}
          image={data.image}
          imageAlt={data.imageAlt}
          imageVariants={data.imageVariants}
          locale={locale}
          relatedPosts={data.relatedPosts}
        />
      </>
    )
  }

  const { post } = data
  return (
    <>
      <GlobalSchemas locale={locale} />
      {[data.jsonLd, ...(data.fallbackSchemas ?? [])].map((s, i) => (
        <script key={`ld-${i}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
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
      />
    </>
  )
}
