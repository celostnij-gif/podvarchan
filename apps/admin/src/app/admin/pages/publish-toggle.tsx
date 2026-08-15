'use client'

import { useRouter } from 'next/navigation'
import { updatePageMeta } from '@/lib/actions/pages'
import { useToast } from '@/components/admin'

interface PublishToggleProps {
  pageId: string
  currentStatus: string
}

export function PublishToggle({ pageId, currentStatus }: PublishToggleProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const isPublished = currentStatus === 'PUBLISHED'

  async function handleClick() {
    const formData = new FormData()
    formData.set('status', isPublished ? 'DRAFT' : 'PUBLISHED')
    try {
      await updatePageMeta(pageId, formData)
      showToast('success', isPublished ? 'Знято з публікації' : 'Опубліковано')
      router.refresh()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Помилка при зміні статусу')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPublished
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {isPublished ? 'Опубліковано' : 'Чернетка'}
    </button>
  )
}
