'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Types ── */

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string) => void
}

/* ── Context ── */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback — если тост вызван вне провайдера, просто логируем
    return {
      showToast: (_variant, _message) =>
        console.warn('[Toast] Использован вне ToastProvider. Убедитесь, что ToastProvider добавлен в layout.'),
    }
  }
  return ctx
}

/* ── Icons ── */

const icons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-success-bg border-success/30 text-success',
  error: 'bg-error-bg border-error/30 text-error',
  info: 'bg-bg-highlight border-border-light text-text-secondary',
}

/* ── Provider ── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, variant, message }])

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast container (fixed to bottom-right) ── */}
      <div
        aria-live="polite"
        aria-relevant="additions removals"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none"
        style={{ maxWidth: '22rem' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 28,
                mass: 0.8,
              }}
              className={[
                'pointer-events-auto',
                'flex items-start gap-3',
                'rounded-xl border px-4 py-3.5',
                'shadow-lg backdrop-blur-sm',
                'text-sm leading-relaxed',
                'cursor-pointer select-none',
                variantStyles[toast.variant],
              ].join(' ')}
              role="status"
              onClick={() => dismiss(toast.id)}
            >
              <span
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold leading-none"
                aria-hidden="true"
              >
                {icons[toast.variant]}
              </span>
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  dismiss(toast.id)
                }}
                className="flex-shrink-0 ml-1 text-current/60 hover:text-current transition-colors"
                aria-label="Закрыть уведомление"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
