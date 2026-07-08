'use client'

import { deletePage } from '@/app/admin/actions/pages'

interface DeleteButtonProps {
  pageId: string
  pageTitle: string
}

export function DeleteButton({ pageId, pageTitle }: DeleteButtonProps) {
  return (
    <form
      action={deletePage.bind(null, pageId)}
      onSubmit={(e) => {
        if (!confirm(`Удалить страницу «${pageTitle}»?`)) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Удалить
      </button>
    </form>
  )
}
