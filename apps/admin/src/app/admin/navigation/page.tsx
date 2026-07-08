import { getNavigationItems } from '@/lib/actions/navigation'
import { NavTreeSortable } from './nav-tree-sortable'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const items = await getNavigationItems()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Навігація</h1>
      <p className="text-sm text-zinc-500">
        Керування пунктами меню для HEADER, FOOTER та MOBILE.
      </p>
      <NavTreeSortable items={items} />
    </div>
  )
}
