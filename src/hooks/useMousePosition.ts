'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface MousePosition {
  x: number
  y: number
  /** Normalised 0–1 relative to viewport */
  nx: number
  ny: number
}

interface UseMousePositionOptions {
  /** Whether to track touches as well (default: false) */
  includeTouch?: boolean
  /** Disable tracking (default: false) */
  disabled?: boolean
}

/**
 * Tracks mouse (and optionally touch) position.
 * Uses requestAnimationFrame for performant updates.
 */
export function useMousePosition({
  includeTouch = false,
  disabled = false,
}: UseMousePositionOptions = {}): MousePosition {
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0, nx: 0, ny: 0 })
  const rafRef = useRef<number | null>(null)
  const currentPos = useRef({ x: 0, y: 0 })

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      currentPos.current = { x: clientX, y: clientY }

      if (rafRef.current !== null) return

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const { x, y } = currentPos.current
        setPos({
          x,
          y,
          nx: x / (typeof window !== 'undefined' ? window.innerWidth : 1),
          ny: y / (typeof window !== 'undefined' ? window.innerHeight : 1),
        })
      })
    },
    []
  )

  useEffect(() => {
    if (disabled) return

    function onMouse(e: MouseEvent) {
      handleMove(e.clientX, e.clientY)
    }

    function onTouch(e: TouchEvent) {
      if (!includeTouch) return
      const t = e.touches[0]
      if (t) handleMove(t.clientX, t.clientY)
    }

    window.addEventListener('mousemove', onMouse, { passive: true })
    if (includeTouch) {
      window.addEventListener('touchmove', onTouch, { passive: true })
    }

    return () => {
      window.removeEventListener('mousemove', onMouse)
      if (includeTouch) {
        window.removeEventListener('touchmove', onTouch)
      }
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [includeTouch, disabled, handleMove])

  return pos
}
