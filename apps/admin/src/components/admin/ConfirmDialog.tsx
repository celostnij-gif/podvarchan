'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Types ── */

export type ConfirmVariant = 'danger' | 'warning'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  onConfirm: () => void
  onCancel: () => void
}

/* ── Styles ── */

const variantStyles: Record<ConfirmVariant, { confirm: string; icon: string }> = {
  danger: {
    confirm: 'bg-red-600 hover:bg-red-500 text-white',
    icon: 'bg-red-900/50 text-red-400 border-red-700/50',
  },
  warning: {
    confirm: 'bg-amber-600 hover:bg-amber-500 text-white',
    icon: 'bg-amber-900/50 text-amber-400 border-amber-700/50',
  },
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
}

/* ── Component ── */

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus trap: keep focus inside the dialog
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === 'Escape') {
        onCancel()
        return
      }

      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }
    },
    [open, onCancel]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the confirm button
      requestAnimationFrame(() => confirmRef.current?.focus())
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            variants={dialogVariants}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md"
          >
            {/* Icon */}
            <div
              className={[
                'w-12 h-12 rounded-xl border flex items-center justify-center mb-4 text-lg',
                variantStyles[variant].icon,
              ].join(' ')}
              aria-hidden="true"
            >
              {variant === 'danger' ? '!' : '?'}
            </div>

            {/* Title */}
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-zinc-100 mb-2"
            >
              {title}
            </h2>

            {/* Message */}
            <p
              id="confirm-message"
              className="text-sm text-zinc-400 mb-6 leading-relaxed"
            >
              {message}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                className={[
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  variantStyles[variant].confirm,
                ].join(' ')}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
