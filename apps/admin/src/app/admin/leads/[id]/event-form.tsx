'use client'

import { useFormStatus } from 'react-dom'
import { addLeadEvent } from '@/app/admin/actions/leads'

interface Props {
  leadId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
    >
      {pending ? 'Додавання...' : 'Додати подію'}
    </button>
  )
}

export function AddEventForm({ leadId }: Props) {
  return (
    <form action={addLeadEvent.bind(null, leadId)} className="space-y-2">
      <input
        name="type"
        type="text"
        required
        placeholder="Тип події (напр. PHONE_CALL, EMAIL, NOTE...)"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <textarea
        name="note"
        rows={2}
        placeholder="Примітка до події..."
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <SubmitButton />
    </form>
  )
}
