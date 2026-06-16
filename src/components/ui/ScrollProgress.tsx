'use client'

import { motion, useSpring } from 'framer-motion'
import { useScrollProgress } from '@/hooks/useScrollProgress'

interface ScrollProgressProps {
  /** Color class (default: bg-gradient-to-r from-gold/40 to-gold) */
  className?: string
  /** Height in px (default: 2) */
  height?: number
  /** Z-index (default: 60) */
  zIndex?: number
  /** Only show after scrolling past this threshold (0–1, default: 0.02) */
  showAfter?: number
}

/**
 * Thin animated progress bar fixed at the top of the viewport.
 * Tracks scroll progress from top to bottom of the page.
 * Only renders on desktop.
 */
export default function ScrollProgress({
  className = 'bg-gradient-to-r from-gold/40 via-gold to-gold-light',
  height = 2,
  zIndex = 60,
  showAfter = 0.02,
}: ScrollProgressProps) {
  const { value } = useScrollProgress()
  const scaleX = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  if (value < showAfter) return null

  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 origin-left ${className}`}
      style={{
        height,
        zIndex,
        scaleX,
        transformOrigin: 'left center',
      }}
      aria-hidden="true"
    />
  )
}
