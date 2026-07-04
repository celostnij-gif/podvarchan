import { getCurrentUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

async function getStats() {
  try {
    const { getDB } = await import('@/db')
    const tables = await import('@/db/schema/index')
    const { count } = await import('drizzle-orm')
    const db = getDB()
    const [servicesCount] = await db.select({ count: count() }).from(tables.services)
    const [postsCount] = await db.select({ count: count() }).from(tables.blogPosts)
    const [faqCount] = await db.select({ count: count() }).from(tables.faqItems)
    const [leadsCount] = await db.select({ count: count() }).from(tables.contactLeads)
    const [pagesCount] = await db.select({ count: count() }).from(tables.pages)
    const [testimonialsCount] = await db.select({ count: count() }).from(tables.testimonials)
    const [usersCount] = await db.select({ count: count() }).from(tables.users)

    return {
      services: servicesCount?.count ?? 0,
      posts: postsCount?.count ?? 0,
      faq: faqCount?.count ?? 0,
      leads: leadsCount?.count ?? 0,
      pages: pagesCount?.count ?? 0,
      testimonials: testimonialsCount?.count ?? 0,
      users: usersCount?.count ?? 0,
    }
  } catch {
    return null
  }
}

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const stats = await getStats()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Вітаємо, {user.name}
        </h1>

      {stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard label="Послуги" value={stats.services} color="blue" />
          <StatCard label="Статті блогу" value={stats.posts} color="green" />
          <StatCard label="FAQ" value={stats.faq} color="purple" />
          <StatCard label="Заявки" value={stats.leads} color="orange" />
          <StatCard label="Сторінки" value={stats.pages} color="indigo" />
          <StatCard label="Відгуки" value={stats.testimonials} color="pink" />
          <StatCard label="Користувачі" value={stats.users} color="teal" />
        </div>
      ) : (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          База даних ще не налаштована. Запустіть <code className="rounded bg-yellow-100 px-1 py-0.5">npm run db:seed</code> після налаштування D1.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color] ?? colorClasses.blue}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
