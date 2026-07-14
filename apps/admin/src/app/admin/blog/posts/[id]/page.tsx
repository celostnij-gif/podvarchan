import { getDB } from '@/db'
import { blogPosts, blogPostTranslations } from '@/db/schema/blog'
import { blogCategories, blogCategoryTranslations } from '@/db/schema/blog'
import { mediaAssets } from '@/db/schema/media'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PostForm } from '../post-form'
import type { PostWithTranslations } from '../../types'

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Returns a displayable URL for a coverImageId.
 * - If it's a path (starts with /), prepend the public site URL (the admin worker
 *   doesn't have static blog images in its assets)
 * - If it's a UUID, resolve from media_assets.publicUrl
 * - If null/empty, derive from the RU slug: /images/blog/{slug}.webp
 */
async function resolveCoverImageUrl(
  coverImageId: string | null,
  db: ReturnType<typeof getDB>,
  slug?: string | null,
): Promise<string | null> {
  if (coverImageId) {
    if (coverImageId.startsWith('/')) return `${PUBLIC_SITE_URL}${coverImageId}`
    if (coverImageId.startsWith('http')) return coverImageId

    // Looks like a UUID — resolve from media_assets
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coverImageId)
    if (isUuid) {
      try {
        const asset = await db
          .select({ publicUrl: mediaAssets.publicUrl })
          .from(mediaAssets)
          .where(eq(mediaAssets.id, coverImageId))
          .get()
        return asset?.publicUrl ?? null
      } catch {
        return null
      }
    }

    return coverImageId
  }

  // Fallback: derive image path from RU slug (matches src/content/blog/ pattern)
  if (slug) {
    return `${PUBLIC_SITE_URL}/images/blog/${slug}.webp`
  }

  return null
}

export default async function EditPostPage(props: Props) {
  const { id } = await props.params
  const db = getDB()

  const rows = await db
    .select()
    .from(blogPosts)
    .leftJoin(blogPostTranslations, eq(blogPosts.id, blogPostTranslations.postId))
    .where(eq(blogPosts.id, id))
    .all()

  if (rows.length === 0) notFound()

  const post: PostWithTranslations = {
    ...rows[0].blog_posts,
    translations: rows.map((r) => r.blog_post_translations).filter(Boolean) as PostWithTranslations['translations'],
    categorySlug: null,
  }

  // Get RU slug for fallback image path derivation
  const ruTranslation = rows.find((r) => r.blog_post_translations?.locale === 'ru')
  const ruSlug = ruTranslation?.blog_post_translations?.slug ?? null

  // Resolve coverImageId to a displayable URL (with fallback to static path)
  const coverImageResolvedUrl = await resolveCoverImageUrl(
    rows[0].blog_posts.coverImageId,
    db,
    ruSlug,
  )

  const catRows = await db
    .select()
    .from(blogCategories)
    .leftJoin(blogCategoryTranslations, eq(blogCategories.id, blogCategoryTranslations.categoryId))
    .all()

  const grouped = new Map<string, { id: string; slugBase: string; ruName?: string }>()
  for (const row of catRows) {
    if (!grouped.has(row.blog_categories.id)) {
      grouped.set(row.blog_categories.id, { id: row.blog_categories.id, slugBase: row.blog_categories.slugBase })
    }
    const entry = grouped.get(row.blog_categories.id)!
    if (row.blog_category_translations?.locale === 'ru' && row.blog_category_translations.name) {
      entry.ruName = row.blog_category_translations.name
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Редагувати пост</h1>
      <PostForm
        post={post}
        categories={Array.from(grouped.values())}
        coverImageResolvedUrl={coverImageResolvedUrl ?? undefined}
      />
    </div>
  )
}
