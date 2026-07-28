'use client'

import { useFormStatus } from 'react-dom'
import { updateInternalNote } from '@/lib/actions/leads'
import { useState } from 'react'
import { useToast } from '@/components/admin'


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
      className="mt-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
    >
      {pending ? 'Збереження...' : 'Зберегти нотатку'}
    </button>
  )
}

export function InternalNoteForm({ leadId, currentNote }: Props) {
  const [note, setNote] = useState(currentNote)
  const dirty = note !== currentNote

  const { showToast } = useToast()

  async function handleSubmit(formData: FormData) {
    try {
      await updateInternalNote(leadId, formData)
      showToast('success', 'Нотатку збережено')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Сталася помилка'
      showToast('error', msg)
    }
  }

  return (
    <form action={handleSubmit}>
      <textarea
        name="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm shadow-sm focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        placeholder="Внутрішня нотатка (видно тільки адмінам)..."
      />
      <SubmitButton dirty={dirty} />
    </form>
  )
}
