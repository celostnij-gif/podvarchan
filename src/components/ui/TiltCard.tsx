'use client'

import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'

/* ── Types ── */

export interface TiltCardProps {
  children: ReactNode
  /** Max rotation angle in degrees. Default 4 */
  tiltDegree?: number
  /** Hover scale. Default 1.015 */
  scale?: number
  /** Glow opacity (gold). Default 0.06 */
  glowOpacity?: number
  /** CSS perspective value in px. Default 800 */
  perspective?: number
  /** Disable tilt (e.g. on touch devices) */
  disabled?: boolean
  className?: string
}

/* ── Component ── */

export default function TiltCard({
  children,
  className = '',
  tiltDegree = 4,
  scale = 1.015,
  glowOpacity = 0.06,
  perspective = 800,
  disabled = false,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState(
    `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  )
  const [glow, setGlow] = useState('0 0 0px rgba(201, 169, 110, 0)')
  const [isDesktop, setIsDesktop] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  /* ── Desktop detection ── */

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  /* ── Mouse move → 3D tilt ── */

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || !isDesktop) return
      const card = cardRef.current
      if (!card) return

      const rect = card.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const mouseX = e.clientX - centerX
      const mouseY = e.clientY - centerY

      const rotateX = (-mouseY / (rect.height / 2)) * tiltDegree
      const rotateY = (mouseX / (rect.width / 2)) * tiltDegree

      setTransform(
        `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
      )
      setGlow(`0 0 ${15 + glowOpacity * 150}px rgba(201, 169, 110, ${glowOpacity})`)
    },
    [disabled, isDesktop, tiltDegree, scale, glowOpacity, perspective]
  )

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    setTransform(
      `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    )
    setGlow('0 0 0px rgba(201, 169, 110, 0)')
  }, [perspective])

  const canTilt = isDesktop && !disabled

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform: isHovered && canTilt ? transform : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        boxShadow: isHovered && canTilt ? glow : 'none',
        transition: 'transform 0.25s ease-out, box-shadow 0.35s ease-out',
        willChange: canTilt ? 'transform' : 'auto',
      }}
    >
      {children}
    </div>
  )
}
