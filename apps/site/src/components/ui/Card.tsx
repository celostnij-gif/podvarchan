import { type ReactNode, type HTMLAttributes } from 'react'

/* ── Types ── */

export type CardVariant = 'default' | 'glow' | 'bordered'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardHover = 'lift' | 'glow' | 'none'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant
  padding?: CardPadding
  hover?: CardHover
  children: ReactNode
  as?: 'div' | 'article' | 'section' | 'li'
}

/* ── Variant styles ── */

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-bg-surface/85 border border-border-base shadow-sm ' +
    'shadow-inner-glow',
  glow:
    'bg-bg-surface/85 border border-gold-muted/20 shadow-glow-gold ' +
    'shadow-inner-glow',

  bordered:
    'bg-transparent border border-border-base',
}

/* ── Padding styles ── */

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-4 md:p-5',
  md: 'p-6 md:p-8',
  lg: 'p-8 md:p-10 lg:p-12',
}

/* ── Hover styles ── */

const hoverStyles: Record<CardHover, string> = {
  lift:
    'cursor-pointer transition-all duration-400 ease-out ' +
    'hover:-translate-y-1 hover:shadow-md hover:border-border-light',

  glow:
    'cursor-pointer transition-all duration-400 ease-out ' +
    'hover:-translate-y-1 hover:shadow-lg hover:border-gold-muted/40 hover:shadow-glow-gold',

  none: '',
}

/* ── Component ── */

export default function Card({
  variant = 'default',
  padding = 'md',
  hover = 'lift',
  as: Tag = 'div',
  children,
  className = '',
  ...rest
}: CardProps) {
  return (
    <Tag
      className={[
        // Base
        'rounded-xl',
        // Variant
        variantStyles[variant],
        // Padding
        paddingStyles[padding],
        // Hover
        hoverStyles[hover],
        // Custom
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
}
