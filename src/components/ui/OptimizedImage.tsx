'use client'

import Image from 'next/image'
import { useState, type CSSProperties } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
  style?: CSSProperties
  aspectRatio?: string
}

/**
 * OptimizedImage — обёртка над next/image с предустановками.
 *
 * Особенности:
 * - По умолчанию lazy loading (кроме priority=true)
 * - Автоматический blur placeholder (генерируется через скрипт сборки)
 * - Обработка ошибок загрузки (fallback)
 * - Поддержка fill + aspectRatio для адаптивных контейнеров
 *
 * @example
 * ```tsx
 * // Фиксированный размер
 * <OptimizedImage src="/images/author.jpg" alt="Фото" width={400} height={400} />
 *
 * // Адаптивный с fill
 * <div className="aspect-video relative">
 *   <OptimizedImage src="/images/blog/post.webp" alt="Post" fill />
 * </div>
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  className = '',
  style,
  aspectRatio,
}: OptimizedImageProps) {
  const [error, setError] = useState(false)

  // Fallback при ошибке загрузки
  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-bg-surface text-text-muted ${className}`}
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          aspectRatio,
        }}
        role="img"
        aria-label={alt}
      >
        <span className="text-sm opacity-50">⚠</span>
      </div>
    )
  }

  const imgProps = {
    src,
    alt,
    className,
    style,
    onError: () => setError(true),
    loading: priority ? ('eager' as const) : ('lazy' as const),
    ...(process.env.NODE_ENV === 'development' && { 'data-optimized': 'true' }),
  }

  if (fill) {
    return (
      <Image
        {...imgProps}
        fill
        sizes={sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        quality={85}
      />
    )
  }

  return (
    <Image
      {...imgProps}
      width={width ?? 800}
      height={height ?? 450}
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      quality={85}
    />
  )
}

/**
 * ImageSkeleton — заглушка-скелетон для изображений во время загрузки.
 */
export function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface
                  bg-[length:200%_100%] ${className}`}
      aria-hidden="true"
    />
  )
}
