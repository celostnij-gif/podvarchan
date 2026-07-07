'use client'

import { useFormStatus } from 'react-dom'
import { updateInternalNote } from '@/app/admin/actions/leads'
import { useState } from 'react'

interface Props {
  leadId: string
  currentNote: string
}

function SubmitButton({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      className="mt-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Збереження...' : 'Зберегти нотатку'}
    </button>
  )
}

export function InternalNoteForm({ leadId, currentNote }: Props) {
  const [note, setNote] = useState(currentNote)
  const dirty = note !== currentNote

  return (
    <form action={updateInternalNote.bind(null, leadId)}>
      <textarea
        name="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="Внутрішня нотатка (видно тільки адмінам)..."
      />
      <SubmitButton dirty={dirty} />
    </form>
  )
}
