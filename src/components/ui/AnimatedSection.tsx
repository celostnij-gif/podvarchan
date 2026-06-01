'use client'

import { type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

// Motion components keyed by tag name
const motionComponents = {
  section: motion.section,
  div: motion.div,
  article: motion.article,
  header: motion.header,
} as const

type AnimatedSectionTag = keyof typeof motionComponents

interface AnimatedSectionProps {
  children: ReactNode
  /** Animation variant preset (default: fadeUp) */
  variant?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'zoomIn' | 'clipReveal'
  /** Stagger delay between children in seconds (default: 0.08) */
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

/* ── Premium easing curve ── */
const easePremium = [0.25, 0.1, 0, 1] as const

/* ── Variant presets ── */

const variants: Record<string, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
  slideRight: {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  },
  zoomIn: {
    hidden: { opacity: 0, scale: 0.85, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
        duration: 0.7,
        ease: easePremium,
      },
    },
  },
  clipReveal: {
    hidden: { opacity: 0, y: 30, clipPath: 'inset(0 0 100% 0)' },
    visible: {
      opacity: 1,
      y: 0,
      clipPath: 'inset(0 0 0% 0)',
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
        duration: 0.8,
        ease: [0.65, 0, 0.35, 1] as const,
      },
    },
  },
}

/** Child animation variant that can be used on children of AnimatedSection */
export const childVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easePremium },
  },
}

/**
 * Reusable animated section wrapper.
 * Wraps children in a motion element with scroll-triggered animation.
 * Children can use `motion.div variants={childVariants}` for staggered animation.
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
  const variantConfig = variants[variant]
  const MotionTag = motionComponents[tag]

  // Merge custom config into the variant
  const mergedVariants: Variants = {
    hidden: variantConfig.hidden,
    visible: {
      ...variantConfig.visible,
      transition: {
        ...(variantConfig.visible as any)?.transition,
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  }

  return (
    <MotionTag
      variants={mergedVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </MotionTag>
  )
}
