'use client'

import { useFormStatus } from 'react-dom'
import { addLeadEvent } from '@/lib/actions/leads'
import { useToast } from '@/components/admin'


interface Props {
  leadId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-md hover:bg-zinc-800 bg-zinc-800 text-zinc-200 px-3 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? 'Додавання...' : 'Додати подію'}
    </button>
  )
}

export function AddEventForm({ leadId }: Props) {
  const { showToast } = useToast()

  async function handleSubmit(formData: FormData) {
    try {
      await addLeadEvent(leadId, formData)
      showToast('success', 'Подію додано')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Сталася помилка'
      showToast('error', msg)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input
        name="type"
        type="text"
        required
        placeholder="Тип події (напр. PHONE_CALL, EMAIL, NOTE...)"
        className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
      />
      <textarea
        name="note"
        rows={2}
        placeholder="Примітка до події..."
        className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
      />
      <SubmitButton />
    </form>
  )
}
