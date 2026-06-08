/**
 * Сторінка редагування відгуку (/admin/testimonials/[id]).
 * Підтримує create (/admin/testimonials/new) та edit режими.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star } from 'lucide-react'
import { getTestimonial } from '@/lib/actions/testimonials'
import { TestimonialEditor } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Редактор отзыва',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TestimonialEditPage({ params }: Props) {
  const { id } = await params
  const isNew = id === 'new'

  let item = undefined
  if (!isNew) {
    const result = await getTestimonial(id)
    if (!result.success) {
      if (result.error.includes('не знайдено')) notFound()
      return (
        <div className="space-y-6">
          <Link href="/admin/testimonials" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200">
            ← Назад к списку
          </Link>
          <div className="rounded-xl border border-red-800/30 bg-red-900/10 p-6 text-center">
            <Star className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{result.error}</p>
          </div>
        </div>
      )
    }
    item = result.data
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/testimonials" className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors duration-200">
        ← Назад к списку
      </Link>

      <TestimonialEditor mode={isNew ? 'create' : 'edit'} item={item} />
    </div>
  )
}
