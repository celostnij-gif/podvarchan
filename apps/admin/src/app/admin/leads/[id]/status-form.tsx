'use client'

import { useFormStatus } from 'react-dom'
import { updateLeadStatus } from '@/lib/actions/leads'

interface Props {
  leadId: string
  currentStatus: string
}

const statuses = ['NEW', 'IN_PROGRESS', 'CONTACTED', 'BOOKED', 'CLOSED', 'SPAM'] as const
const statusLabels: Record<string, string> = {
  NEW: 'Нова',
  IN_PROGRESS: 'В роботі',
  CONTACTED: "Зв'язались",
  BOOKED: 'Записані',
  CLOSED: 'Закрита',
  SPAM: 'Спам',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
    >
      {pending ? 'Збереження...' : 'Змінити статус'}
    </button>
  )
}

export function StatusChangeForm({ leadId, currentStatus }: Props) {
  return (
    <form action={updateLeadStatus.bind(null, leadId)}>
      <select
        name="status"
        defaultValue={currentStatus}
        className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {statusLabels[s] ?? s}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  )
}
