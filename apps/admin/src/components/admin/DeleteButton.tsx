'use client'

import { useFormStatus } from 'react-dom'

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
  return (
    <form
      action={onDelete}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault()
        }
      }}
    >
      <SubmitButton label={label} className={className} />
    </form>
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
