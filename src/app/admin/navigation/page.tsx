import { getNavigationItems } from '@/app/admin/actions/settings'
import { NavigationTree } from './navigation-tree'

export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  const items = await getNavigationItems()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Навігація</h1>
      <p className="text-sm text-gray-500">
        Керування пунктами меню для HEADER, FOOTER та MOBILE.
      </p>
      <NavigationTree items={items} />
    </div>
  )
}
