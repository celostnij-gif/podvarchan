import { type ReactNode, type ElementType, useRef, useEffect, useState } from 'react'

/* ── Tag map for rendering ── */

type AnimatedSectionTag = 'section' | 'div' | 'article' | 'header'

const TAG_MAP: Record<AnimatedSectionTag, ElementType> = {
  section: 'section',
  div: 'div',
  article: 'article',
  header: 'header',
}

/* ── Animation variant → CSS animation class ── */

const VARIANT_CLASSES: Record<string, string> = {
  fadeUp: 'animate-fade-in-up',
  fadeIn: 'animate-fade-in',
  slideLeft: 'animate-slide-in-left',
  slideRight: 'animate-slide-in-right',
  scaleIn: 'animate-scale-in',
  zoomIn: 'animate-fade-in-up',   // fallback — scale+blur not in Tailwind, use fade-up
  clipReveal: 'animate-fade-in',  // fallback — clipPath not in Tailwind, use fade-in
}

/* ── Types ── */

interface AnimatedSectionProps {
  children: ReactNode
  /** Animation variant preset (default: fadeUp) */
  variant?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'zoomIn' | 'clipReveal'
  /** Stagger delay between children in seconds (default: 0.08) — CSS custom property for children */
  staggerDelay?: number
  /** Delay before animation starts in seconds */
  delay?: number
  /** Viewport margin (default: '-80px') */
  margin?: string
  /** Only animate once (default: true) */
  once?: boolean
  /** Additional className */
  className?: string
  /** HTML tag to render (default: section) */
  as?: AnimatedSectionTag
  /** aria-label */
  ariaLabel?: string
}

/** Child animation variant — works with AnimatedSection stagger via CSS custom property */
export const childVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0, 1] as const },
  },
}

/**
 * Reusable animated section wrapper.
 * Uses IntersectionObserver to trigger CSS animation when element enters viewport.
 * Children can use `--stagger-index` CSS custom property for staggered delays.
 */
export default function AnimatedSection({
  children,
  variant = 'fadeUp',
  staggerDelay = 0.08,
  delay = 0,
  margin = '-80px',
  once = true,
  className = '',
  as: tag = 'section',
  ariaLabel,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  const Tag = TAG_MAP[tag]

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { rootMargin: margin, threshold: 0.05 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [once, margin])

  const animationClass = VARIANT_CLASSES[variant] ?? 'animate-fade-in-up'

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`${className} ${isVisible ? animationClass : 'opacity-0'}`}
      style={{
        ...(delay > 0 && isVisible ? { animationDelay: `${delay}s` } : {}),
        '--stagger-delay': `${staggerDelay}s`,
      } as React.CSSProperties}
      aria-label={ariaLabel}
    >
      {children}
    </Tag>
  )
}
