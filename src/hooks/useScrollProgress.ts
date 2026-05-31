'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ScrollProgress {
  /** Current scroll progress 0–1 */
  value: number
  /** Previous frame's progress */
  previous: number
  /** Whether the user is scrolling down */
  isScrollingDown: boolean
}

/**
 * Tracks page scroll progress from 0 (top) to 1 (bottom).
 * Uses requestAnimationFrame for smooth updates.
 */
export function useScrollProgress(): ScrollProgress {
  const [state, setState] = useState<ScrollProgress>({
    value: 0,
    previous: 0,
    isScrollingDown: true,
  })
  const rafRef = useRef<number | null>(null)

  const update = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const value = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0

    setState((prev) => ({
      value,
      previous: prev.value,
      isScrollingDown: value > prev.value,
    }))

    rafRef.current = null
  }, [])

  useEffect(() => {
    function onScroll() {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    // Initial calculation
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [update])

  return state
}
