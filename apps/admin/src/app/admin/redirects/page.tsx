import { getDB } from '@/db'
import { redirectRules } from '@podvarchan/shared'
import { asc, sql } from 'drizzle-orm'
import Pagination from '@/components/admin/Pagination'
import { RedirectRulesList } from './redirect-rules-list'

export const dynamic = 'force-dynamic'

export default async function RedirectsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await props.searchParams).page) || 1
  const PAGE_SIZE = 20
  const offset = (page - 1) * PAGE_SIZE
  const db = getDB()

  const total = await db.select({ count: sql<number>`count(DISTINCT ${redirectRules.id})` }).from(redirectRules).get()
  const totalPages = Math.ceil((total?.count ?? 0) / PAGE_SIZE)

  const rules = await db.select().from(redirectRules).orderBy(asc(redirectRules.createdAt)).limit(PAGE_SIZE).offset(offset).all()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Редиректи</h1>
      <p className="text-sm text-zinc-500">
        Правила перенаправлення з одного URL на інший. Підтримуються 301 (постійний) та 302 (тимчасовий).
      </p>
      <RedirectRulesList rules={rules} />
      <Pagination currentPage={page} totalPages={totalPages} baseUrl="/admin/redirects" />
    </div>
  )
}
