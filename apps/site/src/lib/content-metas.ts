/**
 * Client-safe content utilities — only imports meta data (no HTML bodies).
 * Use on blog list pages and other client components to avoid bundling full blog HTML.
 *
 * NOTE: imports directly from @/content/blog/metas, NOT from @/content/blog,
 * to ensure tree-shaking never pulls BLOG_POSTS (with heavy body HTML) into client bundle.
 */
import { BLOG_POST_METAS } from '@/content/blog/metas'
import { BLOG_POST_METAS_UK } from '@/content/blog/metas-uk'
import type { BlogPost } from '@/types'

function getMetas(locale?: string): Omit<BlogPost, 'body'>[] {
  return locale === 'uk' ? BLOG_POST_METAS_UK : BLOG_POST_METAS
}

/**
 * Returns only metadata (no body) for all blog posts in the specified locale.
 * Safe for client components — no HTML body content in the bundle.
 */
export function getAllBlogPostMetas(locale?: string): Omit<BlogPost, 'body'>[] {
  return getMetas(locale)
}

/**
 * Returns only metadata for posts in the specified category.
 * Safe for server-to-client props — no body content serialized.
 */
export function getBlogPostMetasByCategory(categorySlug: string, locale?: string): Omit<BlogPost, 'body'>[] {
  return getMetas(locale).filter((post) => post.categorySlug === categorySlug)
}
