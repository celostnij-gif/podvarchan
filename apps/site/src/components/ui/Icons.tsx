'use client'

import type { FC, SVGProps } from 'react'
import {
  Brain, Heart, Moon, Lock, Flame, Shield, ShieldOff, Leaf, Compass,
  Smartphone, Feather, CloudSun, CloudFog, Sunrise, Waves, Zap,
  RefreshCw, Sunset, UserCheck, Sparkles, House, FileText, User,
  BookOpen, HelpCircle, DollarSign, Phone, Search, type LucideIcon,
} from 'lucide-react'

/* ── Icon name → Lucide component map ── */

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  heart: Heart,
  moon: Moon,
  lock: Lock,
  flame: Flame,
  shield: Shield,
  'shield-off': ShieldOff,
  leaf: Leaf,
  compass: Compass,
  smartphone: Smartphone,
  feather: Feather,
  'cloud-sun': CloudSun,
  'cloud-fog': CloudFog,
  sunrise: Sunrise,
  waves: Waves,
  zap: Zap,
  'refresh-cw': RefreshCw,
  sunset: Sunset,
  'user-check': UserCheck,
  sparkles: Sparkles,
  /* nav icons */
  house: House,
  'file-text': FileText,
  user: User,
  'book-open': BookOpen,
  'help-circle': HelpCircle,
  'dollar-sign': DollarSign,
  phone: Phone,
  search: Search,
}

/* ── Props ── */

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: string
  size?: number
}

/* ── Dynamic Icon renderer ── */

export function Icon({ name, size = 20, className = '', ...props }: IconProps) {
  const LucideIconComponent = iconMap[name]
  if (!LucideIconComponent) return null
  return (
    <LucideIconComponent
      size={size}
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    />
  )
}

/* ── Service Icon ── */

export function ServiceIcon({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) {
  return <Icon name={name} size={size} className={className} />
}

/* ── Brand Icons (inline SVGs for brand logos) ── */

interface BrandIconProps {
  size?: number
  className?: string
}

export const TelegramIcon: FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M21 5L2 12.5l7 1.5L18 8l-7.5 6.5 1.5 7.5 9-17z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
)

export const WhatsAppIcon: FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
      fill="currentColor"
    />
    <path
      d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.951 9.951 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.889 0-3.633-.656-5.008-1.756l-.36-.268-3.008.894.894-3.008-.268-.36A7.94 7.94 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"
      fill="currentColor"
    />
  </svg>
)

export const EmailIcon: FC<BrandIconProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4l-10 8L2 4" />
  </svg>
)
