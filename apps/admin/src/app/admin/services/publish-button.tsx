'use client'

import { useRouter } from 'next/navigation'
import { publishService } from '@/lib/actions/services'
import { useToast } from '@/components/admin'

interface Props {
  id: string
  status: string
}

export function PublishButton({ id, status }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const isPublished = status === 'PUBLISHED'

  async function handleClick() {
    try {
      await publishService(id)
      showToast('success', isPublished ? 'Знято з публікації' : 'Опубліковано')
      router.refresh()
    } catch {
      showToast('error', 'Помилка при зміні статусу')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        isPublished
          ? 'text-yellow-600 hover:bg-zinc-800'
          : 'text-green-600 hover:bg-zinc-800'
      }`}
    >
      {isPublished ? 'Зняти' : 'Публікувати'}
    </button>
  )
}
