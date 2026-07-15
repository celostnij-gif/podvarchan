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
        <h1 className="text-2xl font-bold text-zinc-100">Дашборд</h1>
        <p className="text-sm text-zinc-500 mt-1">Общая статистика сайта</p>
      </div>

      {!data.dbAvailable && (
        <div className="rounded-xl border border-red-900/30 bg-gradient-to-br from-red-500/5 to-red-600/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-200">База данных недоступна</p>
              {'dbError' in data && data.dbError && (
                <p className="text-xs text-red-400/70 mt-1 font-mono">{data.dbError}</p>
              )}
              <p className="text-xs text-zinc-500 mt-2">
                Данные будут загружены после настройки D1 и миграции Server Actions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <StatCard icon={Layers} label="Услуги" value={stats.services.total} sub={`${stats.services.published} опубликовано`} href="/admin/services" color="blue" />
        <StatCard icon={FileText} label="Статьи" value={stats.blog.total} sub={`${stats.blog.published} опубликовано`} href="/admin/blog" color="green" />
        <StatCard icon={MessageSquare} label="Заявки" value={stats.leads.total} sub={`${stats.leads.new} новых`} href="/admin/leads" color="amber" />
        <StatCard icon={HelpCircle} label="FAQ" value={stats.faq.total} sub={`${stats.faq.published} опубликовано`} href="/admin/faq" color="purple" />
        <StatCard icon={Image} label="Медиа" value={stats.media.total} href="/admin/media" color="pink" />
        <StatCard icon={Users} label="Пользователи" value={stats.users.total} sub={`${stats.users.active} активных`} href="/admin/users" color="indigo" />
        <StatCard icon={ArrowLeftRight} label="Редиректы" value={stats.redirects.total} href="/admin/redirects" color="zinc" />
        <StatCard icon={History} label="Ревизии" value={stats.revisions.total} color="zinc" />
      </div>

      {/* Recent Leads */}
      {data.recentLeads.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Последние заявки
            </h2>
            <Link href="/admin/leads" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
              Все заявки <ArrowRight className="w-3 h-3" />
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
              Черновики
            </h2>
          </div>
          <div className="space-y-2">
            {data.drafts.map((draft) => (
              <div key={draft.id} className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                <p className="text-sm text-zinc-300 truncate">{draft.titleRu ?? draft.id}</p>
                <p className="text-xs text-zinc-600">{draft.type}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
