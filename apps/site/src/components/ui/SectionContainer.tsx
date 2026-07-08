import { type ReactNode, type HTMLAttributes } from 'react'

/* ── Types ── */

export type SectionSize = 'xs' | 'sm' | 'md' | 'lg' | 'full'

export interface SectionContainerProps extends HTMLAttributes<HTMLElement> {
  size?: SectionSize
  children: ReactNode
  as?: 'section' | 'div' | 'article' | 'header' | 'footer'
  /** Background variant */
  background?: 'default' | 'deep' | 'subtle' | 'surface' | 'transparent'
  /** Remove max-width constraint */
  fullWidth?: boolean
  /** HTML id for anchor links */
  id?: string
}

/* ── Size padding styles ── */

const sizeStyles: Record<SectionSize, string> = {
  xs: 'py-8 md:py-12',
  sm: 'py-12 md:py-16',
  md: 'py-section-sm md:py-section',        // 64px → 120px
  lg: 'py-section-sm md:py-[10rem]',         // 64px → 160px
  full: 'py-0',                              // No padding, children control spacing
}

 const bgStyles: Record<string, string> = {
   default: 'bg-transparent',
   deep: 'bg-bg-deep/85',
   subtle: 'bg-gradient-subtle',
   surface: 'bg-bg-surface/85',
   transparent: 'bg-transparent',
 }

/* ── Component ── */

export default function SectionContainer({
  size = 'md',
  background = 'default',
  fullWidth = false,
  as: Tag = 'section',
  children,
  className = '',
  id,
  ...rest
}: SectionContainerProps) {
   return (
     <Tag
       id={id}
       className={[
         bgStyles[background],
         sizeStyles[size],
         !fullWidth ? 'section-container' : 'px-6 md:px-8',
         'transition-all duration-700 ease-out',
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
