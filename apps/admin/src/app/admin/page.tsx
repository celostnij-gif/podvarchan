import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Layers,
  FileText,
  MessageSquare,
  HelpCircle,
  Image,
  Users,
  ArrowLeftRight,
  History,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { getDashboardData } from '@/lib/admin/dashboard'
import { DashboardCharts } from '@/components/admin/DashboardCharts'

export const metadata: Metadata = {
  title: 'Дашборд',
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  color = 'zinc',
}: {
  icon: typeof Layers
  label: string
  value: number | string
  sub?: string
  href?: string
  color?: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-900/30',
    green: 'from-green-500/10 to-green-600/5 border-green-900/30',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-900/30',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-900/30',
    pink: 'from-pink-500/10 to-pink-600/5 border-pink-900/30',
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-900/30',
    teal: 'from-teal-500/10 to-teal-600/5 border-teal-900/30',
    zinc: 'from-zinc-500/10 to-zinc-600/5 border-zinc-800/50',
  }

  const card = (
    <div className={`bg-gradient-to-br ${colorClasses[color] ?? colorClasses.zinc} border rounded-xl p-4 transition-all duration-200 group`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-zinc-500" />
      </div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  )

  if (href) {
    return <Link href={href}>{card}</Link>
  }
  return card
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const { stats } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Панель керування</h1>
        <p className="text-sm text-zinc-500 mt-1">Загальна статистика сайту</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/blog/posts/new" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors">
          + Новий пост
        </Link>
        <Link href="/admin/services/new" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors">
          + Нова послуга
        </Link>
        <Link href="/admin/testimonials/new" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors">
          + Новий відгук
        </Link>
        <Link href="/admin/faq/new" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors">
          + Нове FAQ
        </Link>
        <Link href="/admin/settings" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors">
          Налаштування
        </Link>
        <a href="https://podvarchan.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 transition-colors">
          Сайт ↗
        </a>
      </div>

      {!data.dbAvailable && (
        <div className="rounded-xl border border-red-900/30 bg-gradient-to-br from-red-500/5 to-red-600/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-200">База даних недоступна</p>
              {'dbError' in data && data.dbError && (
                <p className="text-xs text-red-400/70 mt-1 font-mono">{data.dbError}</p>
              )}
              <p className="text-xs text-zinc-500 mt-2">
                Дані будуть завантажені після налаштування D1 та міграції Server Actions.
              </p>
            </div>
          </div>
        </div>
      )}

      <DashboardCharts
        stats={[
          { label: 'Послуги', total: stats.services.total, published: stats.services.published, color: '#3b82f6', href: '/admin/services' },
          { label: 'Пости', total: stats.blog.total, published: stats.blog.published, color: '#22c55e', href: '/admin/blog' },
          { label: 'Відгуки', total: stats.testimonials.total, published: stats.testimonials.published, color: '#a855f7', href: '/admin/testimonials' },
          { label: 'FAQ', total: stats.faq.total, published: stats.faq.published, color: '#ec4899', href: '/admin/faq' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard icon={Layers} label="Послуги" value={stats.services.total} sub={`${stats.services.published} опубліковано`} href="/admin/services" color="blue" />
        <StatCard icon={FileText} label="Пости" value={stats.blog.total} sub={`${stats.blog.published} опубліковано`} href="/admin/blog" color="green" />
        <StatCard icon={MessageSquare} label="Заявки" value={stats.leads.total} sub={`${stats.leads.new} нових`} href="/admin/leads" color="amber" />
        <StatCard icon={HelpCircle} label="FAQ" value={stats.faq.total} sub={`${stats.faq.published} опубліковано`} href="/admin/faq" color="purple" />
        <StatCard icon={Image} label="Медіа" value={stats.media.total} href="/admin/media" color="pink" />
        <StatCard icon={Users} label="Користувачі" value={stats.users.total} sub={`${stats.users.active} активних`} href="/admin/users" color="indigo" />
        <StatCard icon={ArrowLeftRight} label="Редиректи" value={stats.redirects.total} href="/admin/redirects" color="zinc" />
        <StatCard icon={History} label="Ревізії" value={stats.revisions.total} color="zinc" />
      </div>

      {/* Recent Leads */}
      {data.recentLeads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Останні заявки
            </h2>
            <Link href="/admin/leads" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
              Всі заявки <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {data.recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/admin/leads/${lead.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 truncate">{lead.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{lead.serviceName ?? lead.email ?? lead.phone}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Drafts */}
      {data.drafts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Чернетки
            </h2>
          </div>
          <div className="space-y-2">
            {data.drafts.map((draft) => {
              const typeLabels: Record<string, string> = {
                service: 'Послуга',
                blog: 'Пост',
                page: 'Сторінка',
                faq: 'FAQ',
              }
              const editHrefs: Record<string, string> = {
                service: `/admin/services/${draft.id}`,
                blog: `/admin/blog/posts/${draft.id}`,
                page: `/admin/pages/${draft.id}`,
                faq: `/admin/faq/${draft.id}`,
              }
              return (
                <Link
                  key={draft.id}
                  href={editHrefs[draft.type] ?? '/admin'}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate">{draft.titleRu ?? draft.id}</p>
                    <p className="text-xs text-zinc-500">{typeLabels[draft.type] ?? draft.type}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
