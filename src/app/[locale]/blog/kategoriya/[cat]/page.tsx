import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { BLOG_CATEGORIES } from '@/constants'
import { generateMetadata as seoMetadata } from '@/lib/seo/metadata'
import { getBlogPostsByCategory, getBlogCategories, getMediaPublicUrl, getBlogFirstImageUrls, resolvePublishedCategorySlug } from '@/lib/db/public'
import { getBlogPost } from '@/lib/content'
import { ClientBlogCategory } from './client-page'
import { CATEGORY_SLUG_UK, resolveCategorySlug } from '@/lib/slugMapping'
import type { BlogPostPublic, BlogCategoryPublic } from '@/lib/db/public'
import type { BlogPost } from '@/types'

export const dynamicParams = true

interface BlogCategoryMeta {
  id?: string
  slug: string
  name: string
  description: string
  metaDescription: string
  keywords: string[]
  serviceSlug?: string
}

async function resolveCategoryMeta(
  rawCat: string,
  locale: string,
): Promise<BlogCategoryMeta | null> {
  const canonical = resolveCategorySlug(rawCat)
  try {
    const cats = await getBlogCategories(locale)
    const found = cats.find((c) => c.slug === rawCat || c.slug === canonical)
    if (found) {
      return {
        id: found.id,
        slug: rawCat,
        name: found.name ?? rawCat,
        description: found.description ?? '',
        metaDescription: found.description ?? '',
        keywords: [],
      }
    }
  } catch {
    // D1 unavailable — fall through to const fallback
  }
  const catEntry = BLOG_CATEGORIES.find((c) => c.slug === canonical)
  if (!catEntry) return null
  return {
    slug: catEntry.slug,
    name: catEntry.slug.charAt(0).toUpperCase() + catEntry.slug.slice(1),
    description: '',
    metaDescription: '',
    keywords: [],
    serviceSlug: catEntry.serviceSlug,
  }
}

export async function generateStaticParams() {
  const ruCats = BLOG_CATEGORIES.map((cat) => ({ cat: cat.slug }))
  const ukCats = BLOG_CATEGORIES.map((cat) => ({ cat: CATEGORY_SLUG_UK[cat.slug] })).filter(
    (c) => c.cat !== undefined,
  )
  return [...ruCats, ...ukCats]
}

interface Props {
  params: Promise<{ cat: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { cat: rawCat, locale } = await params
  const category = await resolveCategoryMeta(rawCat, locale)
  if (!category) return {}
  const t = await getTranslations({ locale, namespace: 'blog' })

  // D1-truth slug pairing by category id (constants map is incomplete vs D1)
  const ruCats = await getBlogCategories('ru').catch(() => [])
  const ukCats = await getBlogCategories('uk').catch(() => [])
  const slugById = (list: BlogCategoryPublic[], id?: string) =>
    id ? list.find((c) => c.id === id)?.slug : undefined
  const canonical = slugById(ruCats, category.id) ?? resolveCategorySlug(rawCat)
  const ukSlug = slugById(ukCats, category.id) ?? CATEGORY_SLUG_UK[canonical]
  const ukPath = ukSlug ? `/blog/kategoriya/${ukSlug}` : undefined

  return seoMetadata({
    title: `${category.name} — ${t('pageTitle')}`,
    description: category.metaDescription,
    keywords: category.keywords,
    path: `/blog/kategoriya/${canonical}`,
    ruPath: `/blog/kategoriya/${canonical}`,
    ukPath,
    locale,
  })
}

function mapPost(p: BlogPostPublic, image?: string, imageAlt?: string): Omit<BlogPost, 'body'> {
  return {
    slug: p.slug,
    title: p.title ?? '',
    description: p.excerpt ?? '',
    metaDescription: p.excerpt ?? '',
    keywords: [],
    categorySlug: p.categorySlug ?? '',
    categoryName: p.categoryName ?? '',
    datePublished: p.publishedAt ?? '',
    dateModified: '',
    author: '',
    readingTime: p.readingMinutes ?? 5,
    image: image,
    imageAlt: imageAlt,
  }
}

export default async function BlogCategoryPage({ params }: Props) {
  const { cat: rawCat, locale } = await params
  const category = await resolveCategoryMeta(rawCat, locale)
  if (!category) {
    // Cross-locale slug swap (lang switcher on admin content): 301 to the
    // correct locale URL instead of a hard 404.
    const resolved = await resolvePublishedCategorySlug(rawCat).catch(() => null)
    if (resolved && resolved.locale !== locale) {
      permanentRedirect(`/${resolved.locale}/blog/kategoriya/${resolved.slug}/`)
    }
    notFound()
  }

  let posts: Omit<BlogPost, 'body'>[] = []

  try {
    const d1Posts = await getBlogPostsByCategory(rawCat, locale)

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

      // 2) Fallback to static content image
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
  } catch {
    // D1 unavailable — client shows empty state
  }

  return <ClientBlogCategory category={category} posts={posts} locale={locale} />
}
