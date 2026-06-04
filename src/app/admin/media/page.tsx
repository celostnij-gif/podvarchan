/**
 * Сторінка медіа-бібліотеки (/admin/media).
 * Показує сітку завантажених файлів з можливістю завантаження та видалення.
 */

import type { Metadata } from 'next'
import { getMediaAssets } from '@/lib/actions/media'
import { MediaLibrary } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Медиа',
}

export default async function MediaPage() {
  const result = await getMediaAssets()
  const assets = result.success ? result.data : []
  const dbAvailable = result.success

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Медиа</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {assets.length} {assets.length === 1 ? 'файл' : 'файлов'}
        </p>
      </div>

      <MediaLibrary assets={assets} />

      {!dbAvailable && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-900/10 border border-amber-800/20 text-sm text-amber-400/80">
          <span>
            База данных D1 не подключена. Запустите проект через{' '}
            <code className="text-amber-300 bg-amber-900/20 px-1.5 py-0.5 rounded text-xs">wrangler</code>{' '}
            для работы с медиа.
          </span>
        </div>
      )}
    </div>
  )
}
