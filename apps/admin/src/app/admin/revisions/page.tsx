import Link from 'next/link'
import { getRecentRevisions } from '@/lib/actions/audit'

export const dynamic = 'force-dynamic'

const ENTITY_LABELS: Record<string, string> = {
  service: 'Послуга',
  blog_post: 'Пост',
  page: 'Сторінка',
  faq_item: 'FAQ',
  testimonial: 'Відгук',
  blog_category: 'Категорія',
  navigation: 'Навігація',
  site_setting: 'Налаштування',
}

export default async function RevisionsPage() {
  const revisions = await getRecentRevisions(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Ревізії</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Останні зміни контенту. Записів: {revisions.length}
        </p>
      </div>

      {revisions.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
          <p className="text-sm text-zinc-500">Ревізій ще немає.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-800/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Дата</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Тип</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">ID сутності</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Мова</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Позначка</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {revisions.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-zinc-300">
                    {new Date(r.createdAt).toLocaleString('uk')}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {ENTITY_LABELS[r.entityType ?? ''] ?? r.entityType}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[140px] truncate font-mono text-zinc-400">
                    {r.entityId}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {r.locale === 'ru' ? '🇷🇺' : r.locale === 'uk' ? '🇺🇦' : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {r.label ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <Link
                      href={`/admin/revisions/${r.entityType}/${r.entityId}`}
                      className="text-amber-400 hover:text-amber-300 hover:underline"
                    >
                      Переглянути
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
