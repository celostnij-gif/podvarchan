'use client'

/**
 * Командна палітра (Ctrl+K / Cmd+K).
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
  ArrowRight,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { searchAdmin, type SearchResultItem } from '@/lib/actions/search'

interface QuickAction {
  label: string
  icon: LucideIcon
  href: string
  shortcut?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Нова стаття', icon: FileText, href: '/admin/blog/new', shortcut: 'B' },
  { label: 'Нова послуга', icon: Puzzle, href: '/admin/services/new', shortcut: 'S' },
  { label: 'Завантажити медіа', icon: Upload, href: '/admin/media', shortcut: 'M' },
]

const TYPE_ICONS: Record<string, LucideIcon> = {
  service: Puzzle,
  blog: FileText,
  lead: MessageSquare,
  page: Layout,
  faq: FileText,
}

interface CommandPaletteProps {
  newLeadsCount?: number
}

export default function CommandPalette({ newLeadsCount: _newLeadsCount }: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredActions = useMemo(() => {
    if (!query) return QUICK_ACTIONS
    const q = query.toLowerCase()
    return QUICK_ACTIONS.filter((a) => a.label.toLowerCase().includes(q))
  }, [query])

  const allItems = useMemo(() => {
    const actions = filteredActions.map((a) => ({ type: 'action' as const, data: a }))
    const searchRes = results.map((r) => ({ type: 'result' as const, data: r }))
    return [...actions, ...searchRes]
  }, [filteredActions, results])

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) return

    const timer = setTimeout(async () => {
      setLoading(true)
      const result = await searchAdmin(query)
      if (result.success && result.data) {
        setResults(result.data)
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = useCallback((item: { type: string; data: QuickAction | SearchResultItem }) => {
    setOpen(false)
    if (item.type === 'action') {
      router.push((item.data as QuickAction).href)
    } else {
      router.push((item.data as SearchResultItem).href)
    }
  }, [router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && allItems[selectedIndex]) {
      e.preventDefault()
      handleSelect(allItems[selectedIndex])
    }
  }, [allItems, selectedIndex, handleSelect])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          >
            <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-800">
                <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Пошук..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
                  autoFocus
                />
                {loading && <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />}
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-500 rounded">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
                {allItems.map((item, i) => {
                  const isSelected = i === selectedIndex

                  if (item.type === 'action') {
                    const action = item.data as QuickAction
                    const Icon = action.icon
                    return (
                      <button
                        key={`action-${action.label}`}
                        onClick={() => handleSelect(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isSelected ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{action.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600" />
                      </button>
                    )
                  }

                  const result = item.data as SearchResultItem
                  const Icon = TYPE_ICONS[result.type] ?? FileText
                  return (
                    <button
                      key={`result-${result.id}`}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="flex-1 text-left min-w-0">
                        <p className="truncate">{result.label}</p>
                        <p className="text-[11px] text-zinc-600 truncate">{result.sublabel}</p>
                      </div>
                    </button>
                  )
                })}

                {!query && filteredActions.length === 0 && (
                  <p className="px-3 py-4 text-xs text-zinc-600 text-center">Швидкі дії</p>
                )}

                {query && !loading && allItems.length === 0 && (
                  <p className="px-3 py-4 text-xs text-zinc-600 text-center">Нічого не знайдено</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
