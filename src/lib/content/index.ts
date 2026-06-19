import type { BlogPost } from '@/types'
import { BLOG_POSTS, BLOG_POST_METAS, BLOG_POSTS_UK, BLOG_POST_METAS_UK } from '@/content/blog'

/**
 * Возвращает массив статей для указанной локали.
 */
function getPosts(locale?: string): BlogPost[] {
  return locale === 'uk' ? BLOG_POSTS_UK : BLOG_POSTS
}

/**
 * Возвращает массив метаданных (без body) для указанной локали.
 */
function getMetas(locale?: string): Omit<BlogPost, 'body'>[] {
  return locale === 'uk' ? BLOG_POST_METAS_UK : BLOG_POST_METAS
}

/**
 * Загружает контентную статью блога по slug и локали.
 */
export function getBlogPost(slug: string, locale?: string): BlogPost | undefined {
  return getPosts(locale).find((post) => post.slug === slug)
}

/**
 * Возвращает список всех slug'ов статей блога.
 * Slug'и одинаковы для всех локалей.
 */
export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug)
}

/**
 * Возвращает все статьи блога для указанной локали.
 */
export function getAllBlogPosts(locale?: string): BlogPost[] {
  return getPosts(locale)
}

/**
 * Возвращает все статьи блога только с метаданными (без body).
 */
export function getAllBlogPostMetas(locale?: string): Omit<BlogPost, 'body'>[] {
  return getMetas(locale)
}

/**
 * Возвращает статьи по категории для указанной локали.
 */
export function getBlogPostsByCategory(categorySlug: string, locale?: string): BlogPost[] {
  return getPosts(locale).filter((post) => post.categorySlug === categorySlug)
}

/**
 * Возвращает последние N статей для указанной локали.
 */
export function getRecentBlogPosts(limit: number = 6, locale?: string): BlogPost[] {
  return getPosts(locale).slice(0, limit)
}

/**
 * Форматирует дату в русскоязычный формат.
 */
export function formatDate(dateString: string, locale: string = 'ru'): string {
  const date = new Date(dateString)
  if (locale.startsWith('uk')) {
    const months = [
      'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
    ]
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Форматирует дату в ISO для schema.org.
 */
export function formatDateISO(dateString: string): string {
  return new Date(dateString).toISOString()
}

/**
 * Транслитерирует русский текст в латиницу для URL.
 */
export function transliterate(text: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  return text
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] || ch)
    .join('')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ── Sitemap / D1 helpers (fallback to constants) ── */

interface TranslationItem {
  id: string
  priority: number
  updatedAt?: Date
  translation: {
    slug: string
    title: string
    metaDescription: string
  }
}

interface BlogPostItem {
  slug: string
  updatedAt?: Date
  publishedAt?: Date
  translation: {
    slug: string
  }
 datePublished?: string
 dateModified?: string
}

/**
 * Запрашивает опубликованные услуги из D1 (или кидает ошибку для fallback).
 */
export async function getPublishedServices(
  _locale: string,
): Promise<TranslationItem[] | null> {
  throw new Error('D1 not available')
}

/**
 * Запрашивает опубликованные категории блога из D1 (или кидает ошибку для fallback).
 */
export async function getPublishedBlogCategories(
  _locale: string,
): Promise<{ translation: { slug: string } }[] | null> {
  throw new Error('D1 not available')
}

/**
 * Запрашивает опубликованные статьи блога из D1 (или кидает ошибку для fallback).
 */
export async function getPublishedBlogPosts(
  _locale: string,
): Promise<BlogPostItem[] | null> {
  throw new Error('D1 not available')
}
