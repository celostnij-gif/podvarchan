'use client'

import { useState, useRef } from 'react'
import { deletePage } from '@/lib/actions/pages'
import { ConfirmDialog } from '@/components/admin'

interface DeleteButtonProps {
  pageId: string
  pageTitle: string
}

export function DeleteButton({ pageId, pageTitle }: DeleteButtonProps) {
  const [open, setOpen] = useState(false)
  const submitRef = useRef<HTMLButtonElement>(null)
  const submittedRef = useRef(false)

  return (
    <>
      <form
        action={deletePage.bind(null, pageId)}
        onSubmit={(e) => {
          if (submittedRef.current) {
            submittedRef.current = false
            return
          }
          e.preventDefault()
          setOpen(true)
        }}
      >
        <button
          type="submit"
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Видалити
        </button>
        <button type="submit" ref={submitRef} style={{ display: 'none' }} />
      </form>
      <ConfirmDialog
        open={open}
        title="Видалити сторінку"
        message={`Видалити сторінку «${pageTitle}»?`}
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
