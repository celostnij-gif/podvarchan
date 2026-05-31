'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface NumberCounterProps {
  /** Target number to count up to */
  to: number
  /** Duration in ms (default: 2000) */
  duration?: number
  /** Start counting from this number (default: 0) */
  from?: number
  /** Decimals to display (default: 0) */
  decimals?: number
  /** Format function for custom formatting */
  format?: (value: number) => string
  /** Only start when visible (default: true) */
  animateOnView?: boolean
  /** Suffix after the number (e.g. "+", "%", "K") */
  suffix?: string
  /** Prefix before the number */
  prefix?: string
  /** Delay before starting animation in ms */
  delay?: number
  /** Easing mode (default: easeOutCubic) */
  easing?: 'linear' | 'easeOutQuad' | 'easeOutCubic' | 'easeOutQuart'
}

const easings: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeOutQuad: (t) => t * (2 - t),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
}

/**
 * Animated number counter that counts up from `from` to `to`.
 * Can be triggered on scroll with `animateOnView`.
 */
export default function NumberCounter({
  to,
  duration = 2000,
  from = 0,
  decimals = 0,
  format,
  animateOnView = true,
  suffix = '',
  prefix = '',
  delay = 0,
  easing = 'easeOutCubic',
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [current, setCurrent] = useState(from)
  const [hasStarted, setHasStarted] = useState(!animateOnView)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const easeFn = easings[easing]

  const animate = useCallback(() => {
    if (!startTimeRef.current) startTimeRef.current = performance.now()
    const elapsed = performance.now() - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easeFn(progress)
    const value = from + (to - from) * easedProgress

    setCurrent(value)

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      setCurrent(to)
    }
  }, [to, from, duration, easeFn])

  useEffect(() => {
    if (!animateOnView || !ref.current) {
      setHasStarted(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()

          if (delay > 0) {
            delayRef.current = setTimeout(() => {
              setHasStarted(true)
            }, delay)
          } else {
            setHasStarted(true)
          }
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
      if (delayRef.current) clearTimeout(delayRef.current)
    }
  }, [animateOnView, delay])

  useEffect(() => {
    if (!hasStarted) return

    startTimeRef.current = null
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [hasStarted, animate])

  const display = format
    ? format(current)
    : current.toFixed(decimals)

  return (
    <span ref={ref} className="tabular-nums" aria-label={`${prefix}${to}${suffix}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
