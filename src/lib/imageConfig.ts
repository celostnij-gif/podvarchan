/**
 * Конфигурация sizes для next/image в разных контекстах.
 * Используется вместе с OptimizedImage компонентом.
 *
 * Формат: media-условие → размер в vw
 * Подробнее: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes
 */

export const IMAGE_SIZES = {
  /**
   * Главное изображение в Hero-секции.
   * На всю ширину на mobile, 50vw на desktop.
   */
  hero: '(max-width: 768px) 100vw, 50vw',

  /**
   * Карточка в сетке (услуги, статьи блога).
   * 1 колонка на mobile, 2 на планшете, 3 на desktop.
   */
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',

  /**
   * Превью статьи / маленькая карточка (2×2, 4×4 сетки).
   */
  thumbnail: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',

  /**
   * Аватар / портрет автора.
   * Квадратное изображение до 96px.
   */
  avatar: '96px',

  /**
   * Изображение на странице статьи (full-width content).
   */
  articleHero: '(max-width: 768px) 100vw, 75rem',

  /**
   * OG-картинка / SEO-превью.
   * Фиксированный размер 1200×630.
   */
  ogImage: '1200px',

  /**
   * Изображение в testimonial / отзыве.
   */
  testimonial: '64px',
} as const

/**
 * Форматы изображений для next.config.mjs.
 */
export const IMAGE_FORMATS = ['image/avif', 'image/webp'] as const

/**
 * Качество JPEG/WebP сжатия по умолчанию.
 */
export const IMAGE_QUALITY = 85
