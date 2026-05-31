'use client'

import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

/* ── Types ── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  children?: ReactNode
  fullWidth?: boolean
}

/* ── Variant styles ── */

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gold text-bg-deep font-semibold ' +
    'shadow-glow-gold ' +
    'hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 ' +
    'active:brightness-95 active:translate-y-0 ' +
    'focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-glow-gold disabled:hover:translate-y-0',

  secondary:
    'bg-transparent text-text-primary font-medium ' +
    'border border-border-light ' +
    'hover:bg-bg-surface hover:border-gold-muted hover:text-gold ' +
    'active:bg-bg-elevated ' +
    'focus-visible:ring-2 focus-visible:ring-border-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border-light disabled:hover:text-text-primary',

  ghost:
    'bg-transparent text-text-secondary font-medium ' +
    'hover:bg-bg-surface hover:text-gold ' +
    'active:bg-bg-elevated ' +
    'focus-visible:ring-2 focus-visible:ring-border-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary',

  danger:
    'bg-error-bg text-error font-semibold ' +
    'border border-error/20 ' +
    'hover:bg-error/10 hover:border-error/40 hover:brightness-110 ' +
    'active:brightness-95 ' +
    'focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-error-bg disabled:hover:border-error/20',
}

/* ── Size styles ── */

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs gap-1.5 rounded-full',
  md: 'px-6 py-2.5 md:px-7 md:py-3 text-sm gap-2 rounded-full',
  lg: 'px-7 py-3 md:px-9 md:py-3.5 text-sm md:text-base gap-2.5 rounded-full',
}

/* ── Loading spinner ── */

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

/* ── Ripple effect ── */

interface Ripple {
  key: number
  x: number
  y: number
  size: number
}

function createRipple(event: React.MouseEvent<HTMLButtonElement>): Ripple {
  const button = event.currentTarget
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  return {
    key: Date.now(),
    x,
    y,
    size,
  }
}

/* ── Component ── */

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])

  const isDisabled = disabled || loading

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) return

    const ripple = createRipple(event)
    setRipples((prev) => [...prev, ripple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.key !== ripple.key))
    }, 600)

    onClick?.(event)
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={[
        // Base
        'relative inline-flex items-center justify-center overflow-hidden',
        'font-body transition-all duration-400 ease-out',
        'select-none',
        // Variant + size
        variantStyles[variant],
        sizeStyles[size],
        // Full width
        fullWidth ? 'w-full' : '',
        // Custom classes
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      {...rest}
    >
      {/* Ripple containers */}
      {ripples.map((ripple) => (
        <span
          key={ripple.key}
          className="absolute pointer-events-none rounded-full bg-white/20 animate-scale-in"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          aria-hidden="true"
        />
      ))}

      {/* Loading spinner */}
      {loading && (
        <Spinner
          className={variant === 'primary' ? 'w-4 h-4 text-bg-deep/60' : 'w-4 h-4 text-current/60'}
        />
      )}

      {/* Icon (hidden while loading) */}
      {!loading && icon && <span className="shrink-0">{icon}</span>}

      {/* Label (hidden while loading — only show spinner) */}
      {!loading && children && <span>{children}</span>}

      {/* Screen-reader loading announcement */}
      {loading && <span className="sr-only">Загрузка...</span>}

      {/* If no children and not loading, icon-only button needs aria-label */}
      {!children && !loading && !rest['aria-label'] && (
        <span className="sr-only">Кнопка</span>
      )}
    </button>
  )
}
