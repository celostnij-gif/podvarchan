'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { ConfirmDialog } from '@/components/admin'
import { useToast } from '@/components/admin'
/**
 * Shared destructive-row "Видалити" button used in list pages (services, categories).
 * `onDelete` is a server-action bound with its id (e.g. `deleteService.bind(null, id)`).
 */
export function DeleteButton({
  onDelete,
  confirmMessage = 'Видалити?',
  label = 'Видалити',
  className = 'rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-zinc-800 disabled:opacity-50',
}: {
  onDelete: () => void | Promise<void>
  confirmMessage?: string
  label?: string
  className?: string
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleDelete = useCallback(async () => {
    setPending(true)
    try {
      await onDelete()
      showToast('success', 'Видалено')
      router.refresh()
    } catch {
      showToast('error', 'Помилка при видаленні')
    } finally {
      setPending(false)
      setConfirmOpen(false)
    }
  }, [onDelete, router, showToast])

  return (
    <>
      <button type="button" disabled={pending} onClick={() => setConfirmOpen(true)} className={className}>
        {pending ? '...' : label}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Підтвердження"
        message={confirmMessage}
        confirmLabel={pending ? '...' : 'Видалити'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
