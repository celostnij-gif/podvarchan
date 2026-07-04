'use client'

import { useFormStatus } from 'react-dom'
import { publishService } from '@/app/admin/actions/services'

interface Props {
  id: string
  status: string
}

function SubmitButton({ status }: { status: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        status === 'PUBLISHED'
          ? 'text-yellow-600 hover:bg-yellow-50'
          : 'text-green-600 hover:bg-green-50'
      }`}
    >
      {pending ? '...' : status === 'PUBLISHED' ? 'Зняти' : 'Публікувати'}
    </button>
  )
}

export function PublishButton({ id, status }: Props) {
  return (
    <form action={publishService.bind(null, id)}>
      <SubmitButton status={status} />
    </form>
  )
}
