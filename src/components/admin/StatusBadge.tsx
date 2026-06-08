'use client'

/* ── Types ── */

export type StatusVariant = 'draft' | 'published' | 'scheduled' | 'archived' | 'hidden' | 'review' | 'spam' | 'active' | 'inactive'

export interface StatusBadgeProps {
  status: StatusVariant
  /** Show colored dot indicator */
  dotOnly?: boolean
  /** Custom label override */
  label?: string
  className?: string
}

/* ── Config ── */

const STATUS_CONFIG: Record<StatusVariant, { defaultLabel: string; dotClass: string; bgClass: string }> = {
  draft:     { defaultLabel: 'Черновик',      dotClass: 'bg-zinc-400',   bgClass: 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50' },
  published: { defaultLabel: 'Опубликовано',   dotClass: 'bg-green-400',  bgClass: 'bg-green-900/30 text-green-400 border border-green-700/30' },
  scheduled: { defaultLabel: 'Запланировано',  dotClass: 'bg-amber-400',  bgClass: 'bg-amber-900/30 text-amber-400 border border-amber-700/30' },
  archived:  { defaultLabel: 'Архив',          dotClass: 'bg-zinc-600',   bgClass: 'bg-zinc-900/50 text-zinc-600 border border-zinc-800/50' },
  hidden:    { defaultLabel: 'Скрыто',         dotClass: 'bg-red-400/70', bgClass: 'bg-red-900/20 text-red-400/70 border border-red-800/20' },
  review:    { defaultLabel: 'На проверке',    dotClass: 'bg-blue-400',   bgClass: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
  spam:      { defaultLabel: 'Спам',           dotClass: 'bg-orange-400', bgClass: 'bg-orange-900/30 text-orange-400 border border-orange-700/30' },
  active:    { defaultLabel: 'Активный',       dotClass: 'bg-green-400',  bgClass: 'bg-green-900/30 text-green-400 border border-green-700/30' },
  inactive:  { defaultLabel: 'Неактивный',     dotClass: 'bg-zinc-500',   bgClass: 'bg-zinc-800/60 text-zinc-500 border border-zinc-700/50' },
}

/* ── Component ── */

export default function StatusBadge({ status, dotOnly = false, label, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const displayLabel = label ?? config.defaultLabel

  if (dotOnly) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${config.bgClass} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
        <span>{displayLabel}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${config.bgClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {displayLabel}
    </span>
  )
}
