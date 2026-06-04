/**
 * Сторінка редактора послуги (/admin/services/[id]).
 * Підтримує два режими:
 *   — /admin/services/new   → створення нової послуги
 *   — /admin/services/[id]  → редагування існуючої
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getService } from '@/lib/actions/services'
import { ServiceEditor } from '@/components/admin'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  if (id === 'new') {
    return { title: 'Новая услуга' }
  }

  const result = await getService(id)
  if (!result.success) {
    return { title: 'Услуга' }
  }

  const ru = result.data.translations.find((t) => t.locale === 'ru')
  return { title: ru?.title ?? result.data.slugBase }
}

export default async function ServiceEditPage({ params }: Props) {
  const { id } = await params

  // ── Режим створення ──
  if (id === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Новая услуга</h1>
          <p className="text-sm text-zinc-500 mt-1">Заполните основные поля и переводы</p>
        </div>
        <ServiceEditor mode="create" />
      </div>
    )
  }

  // ── Режим редагування — завантажуємо дані ──
  const result = await getService(id)

  if (!result.success) {
    if (result.error.includes('не знайдено') || result.error.includes('not found')) {
      notFound()
    }
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Ошибка загрузки</h1>
          <p className="text-sm text-zinc-500 mt-1">{result.error}</p>
        </div>
      </div>
    )
  }

  const { data: service } = result

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">
          {service.translations.find((t) => t.locale === 'ru')?.title ?? service.slugBase}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          slug-base: <code className="text-zinc-400 bg-zinc-900/70 px-1.5 py-0.5 rounded text-[11px]">{service.slugBase}</code>
        </p>
      </div>
      <ServiceEditor mode="edit" service={service} />
    </div>
  )
}
