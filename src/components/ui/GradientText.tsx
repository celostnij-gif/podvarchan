'use client'

import type { ReactNode } from 'react'

type GradientTextTag = 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div'

interface GradientTextProps {
  children: ReactNode
  /** Gradient from color (default: from-gold) */
  from?: string
  /** Gradient via color (optional) */
  via?: string
  /** Gradient to color (default: to-gold-light) */
  to?: string
  /** Whether to animate the gradient position (default: true) */
  animate?: boolean
  /** HTML tag (default: span) */
  as?: GradientTextTag
  /** Additional className */
  className?: string
}

/**
 * Text with gradient background clip.
 * Optionally animated for a subtle shifting gradient effect.
 */
export default function GradientText({
  children,
  from = 'from-gold',
  via,
  to = 'to-gold-light',
  animate = true,
  as: Tag = 'span',
  className = '',
}: GradientTextProps) {
  const gradient = `${from}${via ? ` ${via}` : ''} ${to}`
  const animation = animate
    ? 'bg-[length:200%_auto] animate-gradient-shift'
    : ''

  return (
    <Tag
      className={`text-transparent bg-clip-text bg-gradient-to-r ${gradient} ${animation} ${className}`}
    >
      {children}
    </Tag>
  )
}
