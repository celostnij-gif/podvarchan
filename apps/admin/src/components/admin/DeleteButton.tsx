'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'

import { ConfirmDialog } from '@/components/admin'
/**
 * Shared destructive-row "Видалити" button used in list pages (services, categories).
 * `onDelete` is a server-action bound with its id (e.g. `deleteService.bind(null, id)`).
 */
export function DeleteButton({
  onDelete,
  confirmMessage = 'Видалити?',
  label = 'Видалити',
  className = 'rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50',
}: {
  onDelete: () => void
  confirmMessage?: string
  label?: string
  className?: string
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const hiddenRef = useRef<HTMLButtonElement>(null)
  const shouldSubmit = useRef(false)

  return (
    <>
      <form
        action={onDelete}
        onSubmit={(e) => {
          if (shouldSubmit.current) {
            shouldSubmit.current = false
            return
          }
          e.preventDefault()
          setConfirmOpen(true)
        }}
      >
        <SubmitButton label={label} className={className} />
        <button ref={hiddenRef} type="submit" style={{ display: 'none' }} />
      </form>
      <ConfirmDialog
        open={confirmOpen}
        title="Підтвердження"
        message={confirmMessage}
        confirmLabel="Видалити"
        variant="danger"
        onConfirm={() => {
          shouldSubmit.current = true
          hiddenRef.current?.click()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

function SubmitButton({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? '...' : label}
    </button>
  )
}
