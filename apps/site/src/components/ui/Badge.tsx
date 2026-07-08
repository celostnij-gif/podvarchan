import { type ReactNode, type HTMLAttributes } from 'react'

/* ── Types ── */

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  /** Makes the badge interactive (cursor, hover state) */
  interactive?: boolean
}

/* ── Variant styles ── */

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    'bg-bg-elevated text-text-muted border border-border-base',

  info:
    'bg-gold/10 text-gold border border-gold/20',

  success:
    'bg-success-bg text-success border border-success/20',

  warning:
    'bg-warning-bg text-text-primary border border-border-light',
}

/* ── Size styles ── */

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[0.6875rem]',
  md: 'px-3 py-1 text-xs',
}

/* ── Component ── */

export default function Badge({
  variant = 'info',
  size = 'md',
  interactive = false,
  children,
  className = '',
  onClick,
  ...rest
}: BadgeProps) {
  const isInteractive = interactive && !!onClick

  return (
    <span
      className={[
        // Base
        'inline-flex items-center gap-1.5 font-body font-medium',
        'rounded-full',
        'transition-all duration-300',
        // Variant
        variantStyles[variant],
        // Size
        sizeStyles[size],
        // Interactive
        isInteractive
          ? 'cursor-pointer hover:brightness-125 active:brightness-150'
          : '',
        // Custom
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.(e as unknown as React.MouseEvent<HTMLSpanElement>)
              }
            }
          : undefined
      }
      {...rest}
    >
      {children}
    </span>
  )
}
