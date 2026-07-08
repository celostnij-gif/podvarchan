'use client'

import { useFormStatus } from 'react-dom'
import { deleteService } from '@/app/admin/actions/services'

interface Props {
  id: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? '...' : 'Видалити'}
    </button>
  )
}

export function DeleteButton({ id }: Props) {
  return (
    <form
      action={deleteService.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm('Видалити послугу? Це видалить також переклади.')) {
          e.preventDefault()
        }
      }}
    >
      <SubmitButton />
    </form>
  )
}
