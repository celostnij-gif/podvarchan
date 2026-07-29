'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLead } from '@/lib/actions/leads'
import { ConfirmDialog, useToast } from '@/components/admin'

interface Props {
  id: string
}

export function DeleteButton({ id }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleDelete = useCallback(async () => {
    setPending(true)
    try {
      await deleteLead(id)
      showToast('success', 'Видалено')
      router.refresh()
    } catch {
      showToast('error', 'Помилка при видаленні')
    } finally {
      setPending(false)
      setOpen(false)
    }
  }, [id, router, showToast])

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? '...' : 'Видалити'}
      </button>
      <ConfirmDialog
        open={open}
        title="Видалити заявку"
        message="Видалити заявку? Це також видалить історію подій."
        confirmLabel={pending ? '...' : 'Видалити'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
