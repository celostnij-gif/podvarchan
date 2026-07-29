'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { deletePage } from '@/lib/actions/pages'
import { ConfirmDialog, useToast } from '@/components/admin'

interface DeleteButtonProps {
  pageId: string
  pageTitle: string
}

export function DeleteButton({ pageId, pageTitle }: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleDelete = useCallback(async () => {
    setPending(true)
    try {
      await deletePage(pageId)
      showToast('success', 'Видалено')
      router.push('/admin/pages')
    } catch {
      showToast('error', 'Помилка при видаленні')
    } finally {
      setPending(false)
      setOpen(false)
    }
  }, [pageId, router, showToast])

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
        title="Видалити сторінку"
        message={`Видалити сторінку «${pageTitle}»?`}
        confirmLabel={pending ? '...' : 'Видалити'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
