'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteLead } from '@/lib/actions/leads'
import { ConfirmDialog } from '@/components/admin'

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
  const [open, setOpen] = useState(false)
  const submitRef = useRef<HTMLButtonElement>(null)
  const submittedRef = useRef(false)

  return (
    <>
      <form
        action={deleteLead.bind(null, id)}
        onSubmit={(e) => {
          if (submittedRef.current) {
            submittedRef.current = false
            return
          }
          e.preventDefault()
          setOpen(true)
        }}
      >
        <SubmitButton />
        <button type="submit" ref={submitRef} style={{ display: 'none' }} />
      </form>
      <ConfirmDialog
        open={open}
        title="Видалити заявку"
        message="Видалити заявку? Це також видалить історію подій."
        onConfirm={() => {
          setOpen(false)
          submittedRef.current = true
          submitRef.current?.click()
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
