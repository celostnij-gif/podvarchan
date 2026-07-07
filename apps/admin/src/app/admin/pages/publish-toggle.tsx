'use client'

import { updatePageMeta } from '@/app/admin/actions/pages'

interface PublishToggleProps {
  pageId: string
  currentStatus: string
}

export function PublishToggle({ pageId, currentStatus }: PublishToggleProps) {
  const isPublished = currentStatus === 'PUBLISHED'

  return (
    <form
      action={async (formData) => {
        formData.set('status', isPublished ? 'DRAFT' : 'PUBLISHED')
        try {
          await updatePageMeta(pageId, formData)
        } catch {
          // ignore
        }
      }}
    >
      <button
        type="submit"
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isPublished
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {isPublished ? 'Опубликовано' : 'Черновик'}
      </button>
    </form>
  )
}
