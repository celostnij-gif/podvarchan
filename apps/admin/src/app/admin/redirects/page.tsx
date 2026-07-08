import { getRedirectRules } from '@/lib/actions/redirects'
import { RedirectRulesList } from './redirect-rules-list'

export const dynamic = 'force-dynamic'

export default async function RedirectsPage() {
  const rules = await getRedirectRules()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Редиректи</h1>
      <p className="text-sm text-gray-500">
        Правила перенаправлення з одного URL на інший. Підтримуються 301 (постійний) та 302 (тимчасовий).
      </p>
      <RedirectRulesList rules={rules} />
    </div>
  )
}
