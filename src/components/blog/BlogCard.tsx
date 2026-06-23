import { Link } from '@/i18n/routing'
import { TiltCard } from '@/components/ui'
import { formatDate } from '@/lib/content'

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
  /** Locale for date formatting */
  locale?: string
  /** Read more label */
  readMoreLabel?: string
}

/* ── Blog Card ── */

export default function BlogCard({
  slug,
  title,
  description,
  categoryName,
  categorySlug: _categorySlug,
  datePublished,
  readingTime,
  image,
  imageAlt,
  featured = false,
  minutesLabel = 'мин',
  showCategory = true,
  locale,
  readMoreLabel = 'Читать',
}: BlogCardProps) {
  return (
    <TiltCard tiltDegree={3} scale={1.015} className={`rounded-xl h-full ${featured ? 'md:col-span-2' : ''}`}>
      <Link
        href={`/blog/${slug}/`}
        aria-label={`${title} — ${readMoreLabel}`}
        className="group block border border-border-base
                   hover:border-green hover:shadow-lg hover:shadow-green/5
                   hover:-translate-y-0.5
                   transition-all duration-400 h-full flex flex-col overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2"
      >
        {/* Image with shimmer overlay */}
        {image && (
          <div className={`relative overflow-hidden ${featured ? 'aspect-[2/1]' : 'aspect-video'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic external image */}
            <img
              src={image}
              alt={imageAlt ?? title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            {/* Shimmer overlay on hover — same as CTA buttons */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full
                            transition-transform duration-700 bg-gradient-to-r
                            from-transparent via-white/[0.06] to-transparent" aria-hidden="true" />
          </div>
        )}

        <div className="p-5 md:p-6 flex flex-col flex-1">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-3">
            {showCategory ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                {categoryName}
              </span>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-text-muted">{readingTime} {minutesLabel}</span>
          </div>

          {/* Title */}
          <h2 className={`font-display text-text-primary group-hover:text-green-light transition-colors duration-300 ${
            featured ? 'text-2xl md:text-3xl' : 'text-lg'
          } line-clamp-3`}>
            {title}
          </h2>
          <p className="mt-2.5 text-sm text-text-muted leading-relaxed line-clamp-3 flex-1">
            {description}
          </p>

          {/* Read more link */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-text-muted/70">
              <svg className="w-3.5 h-3.5 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(datePublished, locale)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-green-light opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0">
              {readMoreLabel}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  )
}
