'use client'

/**
 * Responsive <img> with WebP srcSet from variants.
 * Drop-in replacement for next/image on edge/Woker runtime.
 *
 * Usage:
 *   <ResponsiveImage
 *     src="/api/media/media/2026/07/uuid.webp"
 *     alt="alt text"
 *     variants={[{ width: 400, url: '...' }, { width: 800, url: '...' }]}
 *     width={800}
 *     height={450}
 *     priority={false}
 *   />
 */

interface ResponsiveImageProps {
  src: string
  alt: string
  variants?: { width: number; url: string }[]
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
}

export function ResponsiveImage({
  src,
  alt,
  variants,
  width,
  height,
  sizes,
  priority,
  className = '',
}: ResponsiveImageProps) {
  const srcSet = variants
    ?.map(v => `${v.url} ${v.width}w`)
    .join(', ')

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes ?? '(max-width: 768px) 100vw, 800px'}
      width={width}
      height={height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}
