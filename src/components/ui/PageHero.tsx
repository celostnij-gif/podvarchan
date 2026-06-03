import { type ReactNode } from 'react'
import type { BreadcrumbItem } from './Breadcrumbs'
import { useSetBreadcrumbs } from '@/providers/BreadcrumbsProvider'
import HeroBreadcrumbs from '@/components/ui/HeroBreadcrumbs'

/* ── Scattered decoration dots (deterministic) ── */

const SCATTERED_DOTS = [
  { top: 20, left: 20, size: 'w-0.5 h-0.5', opacity: 'bg-gold/40' },
  { top: 60, left: 10, size: 'w-1 h-1', opacity: 'bg-gold/30' },
  { top: 35, left: 5, size: 'w-0.5 h-0.5', opacity: 'bg-gold/45' },
  { bottom: 25, right: 8, size: 'w-0.5 h-0.5', opacity: 'bg-gold/40' },
  { bottom: 15, right: 15, size: 'w-1 h-1', opacity: 'bg-gold/30' },
] as const

/* ── Types ── */

export interface PageHeroProps {
  /** Section label shown above title with gold line (e.g. "FAQ", "Контакты") */
  label?: string
  /** Main page heading */
  title: string
  /** Optional description paragraph */
  description?: string
  /** Text alignment (default: 'left') */
  align?: 'center' | 'left'
  /** Optional badge element above title (replaces label) */
  badge?: ReactNode
  /** Breadcrumb navigation items (rendered above the label) */
  breadcrumbItems?: BreadcrumbItem[]
  /** Extra content after description (e.g. stats, CTA buttons) */
  children?: ReactNode
  /** Additional className for the section */
  className?: string
  /** Clean mode: remove background decorations, center content, reduce top padding */
  clean?: boolean
}

/* ── Background Decorations ── */

function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Main ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-hero opacity-20 blur-[120px]" />
      {/* Orbs */}
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-gold/[0.04] via-transparent to-transparent blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-green/[0.03] via-transparent to-transparent blur-3xl" />
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(201,169,110,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      {/* Scattered golden dots */}
      {SCATTERED_DOTS.map((dot, i) => (
        <div
          key={i}
          className={`absolute ${dot.size} rounded-full ${dot.opacity}`}
          style={{
            ...('top' in dot ? { top: `${dot.top}%` } : {}),
            ...('bottom' in dot ? { bottom: `${dot.bottom}%` } : {}),
            ...('left' in dot ? { left: `${dot.left}%` } : {}),
            ...('right' in dot ? { right: `${dot.right}%` } : {}),
          }}
        />
      ))}
    </div>
  )
}

/* ── CSS fade-up animation with staggered delays ── */

const staggerDelays = ['150ms', '250ms', '350ms', '450ms']

function StaggerFadeUp({
  children,
  index,
  className = '',
}: {
  children: ReactNode
  index: number
  className?: string
}) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: staggerDelays[index] ?? '0ms' }}
    >
      {children}
    </div>
  )
}

/* ── Component ── */

export default function PageHero({
  label,
  title,
  description,
  align = 'left',
  badge,
  breadcrumbItems,
  children,
  className = '',
  clean,
}: PageHeroProps) {
  // Set breadcrumbs via context (layout renders them in a unified position)
  useSetBreadcrumbs(breadcrumbItems ?? [])
  const isClean = clean === true
  const effectiveAlign = align
  const alignClass = effectiveAlign === 'left' ? 'text-left' : 'text-center mx-auto'
  const contentWidth = effectiveAlign === 'left' ? '' : 'max-w-3xl mx-auto'
  const paddingClass = isClean ? 'pt-16 pb-10 md:pt-20 md:pb-14' : 'pt-24 pb-16 md:pt-32 md:pb-20'

  let childIndex = 0

  return (
    <section
      className={`relative overflow-hidden
                  ${paddingClass} ${className}`}
    >
      {!isClean && <HeroBackground />}

      <div className="relative z-10 w-full max-w-container mx-auto px-gutter">
        <div className={`${contentWidth} ${alignClass}`}>
          {/* Breadcrumbs */}
          <HeroBreadcrumbs />

          {/* Badge (custom element, e.g. pill badge) */}
          {badge && (
            <StaggerFadeUp index={childIndex++}>
              {badge}
            </StaggerFadeUp>
          )}

          {/* Section label with gold line */}
          {!badge && label && (
            <StaggerFadeUp index={childIndex++}>
              <div className={`inline-flex items-center gap-3 ${effectiveAlign === 'center' ? 'justify-center' : ''}`}>
                <span className="w-8 h-px bg-gold/40" aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gold">
                  {label}
                </span>
              </div>
            </StaggerFadeUp>
          )}

          {/* Title */}
          <StaggerFadeUp index={childIndex++}>
            <h1 className={`mt-4 text-4xl md:text-5xl lg:text-6xl font-display text-gold-premium leading-tight tracking-tight`}>
              {title}
            </h1>
          </StaggerFadeUp>

          {/* Description */}
          {description && (
            <StaggerFadeUp index={childIndex++}>
              <p className={`mt-4 text-lg text-text-secondary leading-relaxed ${
                effectiveAlign === 'left' ? 'max-w-2xl' : 'max-w-2xl mx-auto'
              }`}>
                {description}
              </p>
            </StaggerFadeUp>
          )}

          {/* Extra content (e.g. stats, CTA buttons) */}
          {children && (
            <StaggerFadeUp index={childIndex++}>
              <div className={effectiveAlign === 'center' ? 'text-center' : ''}>
                {children}
              </div>
            </StaggerFadeUp>
          )}
        </div>
      </div>
    </section>
  )
}
