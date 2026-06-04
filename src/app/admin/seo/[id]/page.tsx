/**
 * Сторінка редагування SEO-метаданих (/admin/seo/[id]).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Search } from 'lucide-react'
import { getSeoMeta } from '@/lib/actions/seo'
import { SeoEditor } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Редактор SEO',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function SeoEditPage({ params }: Props) {
  const { id } = await params
  const result = await getSeoMeta(id)

  if (!result.success) {
    if (result.error.includes('не знайдено')) notFound()
    return (
      <div className="space-y-6">
        <Link href="/admin/seo" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200">
          ← Назад к списку
        </Link>
        <div className="rounded-xl border border-red-800/30 bg-red-900/10 p-6 text-center">
          <Search className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">{result.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/seo" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200">
        ← Назад к списку
      </Link>
      <SeoEditor meta={result.data} />
    </div>
  )
}
