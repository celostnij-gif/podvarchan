'use client'

import { useFormStatus } from 'react-dom'
import { updateLeadStatus } from '@/app/admin/actions/leads'

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
      className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
