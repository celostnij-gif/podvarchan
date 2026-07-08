'use client'

export type StatusVariant = 'draft' | 'published' | 'scheduled' | 'archived' | 'hidden' | 'review' | 'spam' | 'active' | 'inactive'
  | 'owner' | 'admin' | 'editor' | 'viewer'

export interface StatusBadgeProps {
  status: StatusVariant
  dotOnly?: boolean
  label?: string
  className?: string
}

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
  owner:     { defaultLabel: 'Владелец',        dotClass: 'bg-amber-400',  bgClass: 'bg-amber-900/30 text-amber-400 border border-amber-700/30' },
  admin:     { defaultLabel: 'Админ',           dotClass: 'bg-blue-400',   bgClass: 'bg-blue-900/30 text-blue-400 border border-blue-700/30' },
  editor:    { defaultLabel: 'Редактор',        dotClass: 'bg-green-400',  bgClass: 'bg-green-900/30 text-green-400 border border-green-700/30' },
  viewer:    { defaultLabel: 'Зритель',          dotClass: 'bg-zinc-400',  bgClass: 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50' },
}

export default function StatusBadge({ status, dotOnly = false, label, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  const displayLabel = label ?? config.defaultLabel

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${config.bgClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {!dotOnly && <span>{displayLabel}</span>}
    </span>
  )
}
