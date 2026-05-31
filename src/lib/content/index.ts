import type { BlogPost } from '@/types'
import { BLOG_POSTS, BLOG_POST_METAS } from '@/content/blog'

/**
 * Загружает контентную статью блога по slug.
 */
export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

/**
 * Возвращает список всех slug'ов статей блога.
 */
export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug)
}

/**
 * Возвращает все статьи блога.
 */
export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS
}

/**
 * Возвращает все статьи блога только с метаданными (без body).
 * Для использования в клиентских компонентах — минимизирует размер бандла.
 */
export function getAllBlogPostMetas(): Omit<BlogPost, 'body'>[] {
  return BLOG_POST_METAS
}

/**
 * Возвращает статьи по категории.
 */
export function getBlogPostsByCategory(categorySlug: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.categorySlug === categorySlug)
}

/**
 * Возвращает последние N статей.
 */
export function getRecentBlogPosts(limit: number = 6): BlogPost[] {
  return BLOG_POSTS.slice(0, limit)
}

/**
 * Форматирует дату в русскоязычный формат.
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Форматирует дату в ISO для schema.org.
 */
export function formatDateISO(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

/**
 * Транслитерирует русский текст в латиницу для URL.
 */
export function transliterate(text: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
    ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo',
    Ж: 'Zh', З: 'Z', И: 'I', Й: 'I', К: 'K', Л: 'L', М: 'M',
    Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U',
    Ф: 'F', Х: 'Kh', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Shch',
    Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
  }

  return text
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}
