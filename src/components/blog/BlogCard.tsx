'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/routing'
import { TiltCard } from '@/components/ui'
import { formatDate } from '@/lib/content'

/* ── Child animation variant for staggered grids ── */

export const blogCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0, 1] as const },
  },
}

/* ── Types ── */

export interface BlogCardProps {
  slug: string
  title: string
  description: string
  categoryName: string
  categorySlug: string
  datePublished: string
  readingTime: number
  image?: string
  imageAlt?: string
  /** Whether this card should render as "featured" (larger, 2-col span) */
  featured?: boolean
  /** Minutes label (from translation) */
  minutesLabel?: string
  /** Show category badge? (default: true) */
  showCategory?: boolean
}

/* ── Blog Card ── */

export default function BlogCard({
  slug,
  title,
  description,
  categoryName,
  categorySlug,
  datePublished,
  readingTime,
  image,
  imageAlt,
  featured = false,
  minutesLabel = 'мин',
  showCategory = true,
}: BlogCardProps) {
  return (
    <TiltCard tiltDegree={3} scale={1.015} className={`rounded-xl h-full ${featured ? 'md:col-span-2' : ''}`}>
      <Link
        href={`/blog/${slug}/`}
        className="group block bg-bg-surface border border-border-base
                   hover:border-gold-muted hover:shadow-lg hover:shadow-gold/5
                   transition-all duration-400 h-full flex flex-col overflow-hidden rounded-xl"
      >
        {/* Image */}
        {image && (
          <div className={`overflow-hidden ${featured ? 'aspect-[2/1]' : 'aspect-video'}`}>
            <img
              src={image}
              alt={imageAlt ?? title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-6 flex flex-col flex-1">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-4">
            {showCategory ? (
              <span className="text-xs font-medium uppercase tracking-widest text-gold">
                {categoryName}
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-text-muted">{readingTime} {minutesLabel}</span>
          </div>

          {/* Title */}
          <h2 className={`font-display text-text-primary group-hover:text-gold transition-colors ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg'
          } line-clamp-3`}>
            {title}
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm text-text-muted line-clamp-3 flex-1">
            {description}
          </p>

          {/* Date */}
          <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
            <span>{formatDate(datePublished)}</span>
          </div>
        </div>
      </Link>
    </TiltCard>
  )
}
