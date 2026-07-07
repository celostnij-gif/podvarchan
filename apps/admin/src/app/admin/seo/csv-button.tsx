'use client'

import { useTransition } from 'react'
import { exportSeoCsv } from '@/app/admin/actions/seo'

export function CsvExportButton() {
  const [isPending, startTransition] = useTransition()

  function handleExport() {
    startTransition(async () => {
      const csv = await exportSeoCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seo-audit-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {isPending ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
