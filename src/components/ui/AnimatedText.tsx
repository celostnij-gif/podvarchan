'use client'

import {
  useRef,
  useEffect,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from 'react'

/* ── Types ── */

export type AnimatedDirection = 'up' | 'down' | 'left' | 'right'

export interface AnimatedTextProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4'
  direction?: AnimatedDirection
  /** Delay in ms before animation starts (100-1200) */
  delay?: number
  /** Duration in ms (300-1500) */
  duration?: number
  /** Trigger once and stop observing */
  once?: boolean
  /** Threshold for IntersectionObserver (0-1) */
  threshold?: number
}

/* ── Direction → animation class ── */

const directionAnimations: Record<AnimatedDirection, string> = {
  up: 'animate-fade-in-up',
  down: 'animate-fade-in-down',
  left: 'animate-slide-in-left',
  right: 'animate-slide-in-right',
}

/* ── Component ── */

export default function AnimatedText({
  children,
  as: Tag = 'div',
  direction = 'up',
  delay = 0,
  duration = 700,
  once = true,
  threshold = 0.15,
  className = '',
  style,
  ...rest
}: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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
      { threshold, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [once, threshold])

  const animationClass = isVisible ? directionAnimations[direction] : 'opacity-0'

  return (
    <Tag
      ref={ref}
      className={[
        'transition-none',
        isVisible ? animationClass : 'opacity-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...(delay > 0 ? { animationDelay: `${delay}ms` } : {}),
        ...(duration !== 700 ? { animationDuration: `${duration}ms` } : {}),
        ...(style || {}),
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
