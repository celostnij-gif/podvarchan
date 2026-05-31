'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'

interface CursorFollowerProps {
  /** Disable on mobile even without touch detection (default: true) */
  disableMobile?: boolean
  /** Size of the dot in px (default: 8) */
  size?: number
  /** Color (default: gold/30) */
  color?: string
  /** Spring stiffness (default: 150) */
  stiffness?: number
  /** Spring damping (default: 20) */
  damping?: number
  /** Only show on hoverable elements with data-cursor attribute (default: false) */
  hoverOnly?: boolean
}

/**
 * Subtle decorative dot that follows the cursor.
 * Only shows on desktop. Adds a premium, polished feel.
 */
export default function CursorFollower({
  disableMobile = true,
  size = 8,
  color = 'rgba(201, 169, 110, 0.25)',
  stiffness = 150,
  damping = 20,
  hoverOnly = false,
}: CursorFollowerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const mouseX = useSpring(0, { stiffness, damping })
  const mouseY = useSpring(0, { stiffness, damping })

  useEffect(() => {
    // Check once — is this a desktop device?
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    setIsDesktop(mq.matches)

    function onMove(e: PointerEvent) {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      setIsVisible(true)
    }

    function onLeave() {
      setIsVisible(false)
    }

    function onEnter() {
      setIsVisible(true)
    }

    function onHoverStart(e: PointerEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-cursor]')) {
        setIsHovering(true)
      }
    }

    function onHoverEnd(e: PointerEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-cursor]')) {
        setIsHovering(false)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)

    if (hoverOnly) {
      window.addEventListener('pointerover', onHoverStart)
      window.addEventListener('pointerout', onHoverEnd)
    }

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      window.removeEventListener('pointerover', onHoverStart)
      window.removeEventListener('pointerout', onHoverEnd)
    }
  }, [mouseX, mouseY, hoverOnly])

  if (!isDesktop || disableMobile) return null
  if (!isVisible) return null
  if (hoverOnly && !isHovering) return null

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        x: mouseX,
        y: mouseY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      aria-hidden="true"
    >
      <motion.div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          boxShadow: `0 0 6px ${color}`,
        }}
        animate={{
          scale: isHovering ? 2 : 1,
          opacity: isHovering ? 0.6 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0, 1] }}
      />
    </motion.div>
  )
}
