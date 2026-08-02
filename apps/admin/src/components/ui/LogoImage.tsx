'use client'

import { useState, type ImgHTMLAttributes } from 'react'

interface LogoImageProps {
  className?: string
  priority?: boolean
}

const SIZES_ATTR = '(max-width: 768px) 32px, 36px'

/**
 * Site URL prefix — адмінка не має статичних файлів сайту,
 * тому завантажуємо логотип з головного домену (де є public/).
 */
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://podvarchan.com'

/**
 * LogoImage — оптимізоване зображення логотипу з webp/avif srcSet.
 *
 * Генерує `<picture>` з:
 * 1. `<source>` для AVIF (усі розміри)
 * 2. `<source>` для WebP (усі розміри)
 * 3. `<img>` як fallback — PNG
 *
 * Усі варіанти попередньо згенеровані скриптом generate-logo-images.mjs,
 * тому on-the-fly оптимізація Next.js не потрібна.
 *
 * Розміри (ширина у відображенні):
 *   mobile: 32px (w-8)
 *   desktop: 36px (md:w-9)
 */
export function LogoImage({ className = '', priority = false }: LogoImageProps) {
  const [error, setError] = useState(false)

  if (error) {
    return null
  }

  function url(path: string) {
    return `${BASE}${path}`
  }

  const srcSetAvif = [
    url('/images/logo/logo-32.avif') + ' 32w',
    url('/images/logo/logo-48.avif') + ' 48w',
    url('/images/logo/logo-64.avif') + ' 64w',
    url('/images/logo/logo-96.avif') + ' 96w',
    url('/images/logo/logo-128.avif') + ' 128w',
    url('/images/logo/logo-192.avif') + ' 192w',
  ].join(', ')

  const srcSetWebp = [
    url('/images/logo/logo-32.webp') + ' 32w',
    url('/images/logo/logo-48.webp') + ' 48w',
    url('/images/logo/logo-64.webp') + ' 64w',
    url('/images/logo/logo-96.webp') + ' 96w',
    url('/images/logo/logo-128.webp') + ' 128w',
    url('/images/logo/logo-192.webp') + ' 192w',
  ].join(', ')

  const imgProps: ImgHTMLAttributes<HTMLImageElement> = {
    src: url('/images/logo/logo-192.webp'),
    alt: '',
    width: 36,
    height: 36,
    className: `relative z-10 flex-shrink-0 w-8 h-8 md:w-9 md:h-9 object-contain
                  transition-all duration-500 ease-out
                  group-hover:scale-110 group-hover:rotate-[6deg] group-hover:brightness-110
                  ${className}`,
    onError: () => setError(true),
  }

  if (priority) {
    imgProps.fetchPriority = 'high'
    imgProps.loading = 'eager'
  } else {
    imgProps.loading = 'lazy'
  }

  return (
    <picture>
      {/* AVIF */}
      <source
        type="image/avif"
        srcSet={srcSetAvif}
        sizes={SIZES_ATTR}
      />
      {/* WebP */}
      <source
        type="image/webp"
        srcSet={srcSetWebp}
        sizes={SIZES_ATTR}
      />
      {/* Fallback — WebP */}
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is provided via imgProps spread */}
      <img {...imgProps} />
    </picture>
  )
}
