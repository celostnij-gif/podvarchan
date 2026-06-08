'use client'

/**
 * Командна палітра (Ctrl+K / Cmd+K).
 *
 * Шукає по: послугам, статтям, заявкам, сторінкам.
 * Швидкі дії: нова стаття, нова послуга, завантажити медіа, SEO, журнал.
 * Навігація стрілками + Enter.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Puzzle,
  MessageSquare,
  Layout,
  Upload,
  BarChart3,
  ClipboardList,
  Command,
  ArrowRight,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { searchAdmin, type SearchResultItem } from '@/lib/actions/search'

/* ── Quick actions ── */

interface QuickAction {
  label: string
  description: string
  href: string
  icon: LucideIcon
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Новая статья', description: 'Создать статью в блоге', href: '/admin/blog/new', icon: FileText },
  { label: 'Новая услуга', description: 'Добавить новую услугу', href: '/admin/services/new', icon: Puzzle },
  { label: 'Загрузить медиа', description: 'Добавить изображение или файл', href: '/admin/media', icon: Upload },
  { label: 'Настройки SEO', description: 'Управление SEO-метаданными', href: '/admin/seo', icon: BarChart3 },
  { label: 'Журнал действий', description: 'Просмотр аудит-лога', href: '/admin/audit', icon: ClipboardList },
]

/* ── Type icons ── */

const TYPE_ICONS: Record<string, LucideIcon> = {
  service: Puzzle,
  blog: FileText,
  lead: MessageSquare,
  page: Layout,
}

/* ── Component ── */

interface CommandPaletteProps {
  newLeadsCount?: number
}

export default function CommandPalette({ newLeadsCount }: CommandPaletteProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ── Keyboard shortcut: Ctrl+K / Cmd+K ── */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  /* ── Focus input when opened ── */

  useEffect(() => {
    if (isOpen) {
      const tid = setTimeout(() => {
        setQuery('')
        setResults([])
        setSelectedIndex(0)
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(tid)
    }
  }, [isOpen])

  /* ── Search debounce ── */

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const result = await searchAdmin(q)
      if (result.success) {
        setResults(result.data)
      }
    } catch {
      // Silent fail
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      const tid = setTimeout(() => {
        setResults([])
        setIsSearching(false)
      }, 0)
      return () => clearTimeout(tid)
    }

    searchTimeoutRef.current = setTimeout(() => performSearch(query), 200)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, performSearch])

  /* ── Combined items (quick actions + search results) ── */

  const filteredActions = useMemo(() => {
    if (!query.trim()) return QUICK_ACTIONS
    const lower = query.toLowerCase()
    return QUICK_ACTIONS.filter(
      (a) => a.label.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower),
    )
  }, [query])

  const allItems = results.length > 0
    ? results
    : filteredActions.map((a) => ({
        id: a.href,
        type: 'quick_action' as const,
        label: a.label,
        sublabel: a.description,
        href: a.href,
        icon: a.icon,
      }))

  /* ── Navigation ── */

  const handleSelect = useCallback(
    (item: { href: string }) => {
      setIsOpen(false)
      router.push(item.href)
    },
    [router],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && allItems[selectedIndex]) {
        e.preventDefault()
        handleSelect(allItems[selectedIndex] as { href: string })
      }
    },
    [allItems, selectedIndex, handleSelect],
  )

  /* ── Render ── */

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0, 1] }}
            className="fixed inset-x-4 top-[15%] mx-auto max-w-lg z-50"
          >
            <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50">
                {isSearching ? (
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-zinc-500 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSelectedIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Поиск по услугам, статьям, заявкам..."
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 outline-none border-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-600 bg-zinc-800/70 border border-zinc-700/50">
                  <Command className="w-2.5 h-2.5" />
                  K
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
                {!query.trim() && (
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Быстрые действия
                    </p>
                  </div>
                )}

                {allItems.length === 0 && query.trim() && !isSearching && (
                  <div className="px-3 py-8 text-center">
                    <p className="text-sm text-zinc-500">Ничего не найдено</p>
                    <p className="text-xs text-zinc-600 mt-1">Попробуйте другой запрос</p>
                  </div>
                )}

                {allItems.length > 0 && results.length === 0 && query.trim() && (
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                      Быстрые действия
                    </p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="px-3 py-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                      Результаты поиска
                    </p>
                  </div>
                )}

                {allItems.map((item, index) => {
                  const isSelected = index === selectedIndex
                  const Icon = (item as { icon?: LucideIcon }).icon ?? TYPE_ICONS[(item as SearchResultItem).type] ?? ArrowRight

                  return (
                    <button
                      key={`${(item as SearchResultItem).type ?? 'action'}-${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item as { href: string })}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isSelected
                          ? 'bg-gold/10 text-gold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-gold/15 text-gold'
                          : 'bg-zinc-800/50 text-zinc-500'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-gold' : 'text-zinc-200'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-zinc-600 truncate">
                          {'sublabel' in item ? (item as { sublabel: string }).sublabel : ''}
                        </p>
                      </div>
                      {(item as SearchResultItem).type && (
                        <span className={`text-[10px] font-medium uppercase tracking-wider shrink-0 ${
                          isSelected ? 'text-gold/60' : 'text-zinc-700'
                        }`}>
                          {('type' in item ? (item as { type: string }).type : '').replace('_', ' ')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/50 bg-zinc-950/50">
                <div className="flex items-center gap-3 text-[11px] text-zinc-600">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-[10px] text-zinc-500">↑↓</kbd>
                    Навигация
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-[10px] text-zinc-500">↵</kbd>
                    Выбрать
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 text-[10px] text-zinc-500">Esc</kbd>
                    Закрыть
                  </span>
                </div>
                {newLeadsCount !== undefined && newLeadsCount > 0 && (
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    {newLeadsCount} новых заявок
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
